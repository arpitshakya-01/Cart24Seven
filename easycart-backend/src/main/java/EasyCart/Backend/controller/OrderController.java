package EasyCart.Backend.controller;

import EasyCart.Backend.entity.Order;
import EasyCart.Backend.entity.PaymentAttempt;
import EasyCart.Backend.repository.OrderRepository;
import EasyCart.Backend.repository.PaymentAttemptRepository;
import EasyCart.Backend.dto.DeliveryAddress;
import EasyCart.Backend.service.OrderService;
import EasyCart.Backend.service.RazorpayPaymentService;
import EasyCart.Backend.service.StockService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "${APP_FRONTEND_ORIGIN:http://localhost:5173}")
public class OrderController {
    private final OrderRepository orderRepository;
    private final PaymentAttemptRepository paymentAttempts;
    private final RazorpayPaymentService razorpay;
    private final OrderService orderService;
    private final StockService stock;
    private final ObjectMapper mapper;
    @Value("${app.payment.demo.enabled:false}") private boolean demoPaymentsEnabled;

    public OrderController(OrderRepository orderRepository, PaymentAttemptRepository paymentAttempts,
                           RazorpayPaymentService razorpay, ObjectMapper mapper, OrderService orderService,
                           StockService stock) {
        this.orderRepository = orderRepository;
        this.paymentAttempts = paymentAttempts;
        this.razorpay = razorpay;
        this.mapper = mapper;
        this.orderService = orderService;
        this.stock = stock;
    }

    @PostMapping("/place")
    @Transactional
    public List<Order> placeCashOnDelivery(@RequestBody DeliveryAddress address, Authentication auth) {
        List<Order> orders = orderService.createOrders(address, auth.getName(), "COD", "UNPAID");
        reserveStockOrFail(orders);
        List<Order> saved = orderRepository.saveAll(orders);
        orderService.clearCart(auth.getName());
        saved.forEach(this::hideSellerPricing);
        return saved;
    }

    @GetMapping("/payment/config")
    public PaymentConfig paymentConfig() {
        return new PaymentConfig(razorpay.isConfigured(), razorpay.isConfigured() ? razorpay.getKeyId() : "", demoPaymentsEnabled);
    }

    @PostMapping("/payment/demo")
    @Transactional
    public List<Order> placeDemoPayment(@RequestBody DemoPaymentRequest request, Authentication auth) {
        if (!demoPaymentsEnabled) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Demo payments are disabled.");
        if (request == null || request.address() == null || request.method() == null
                || !List.of("UPI", "DEBIT_CARD", "CREDIT_CARD", "NET_BANKING").contains(request.method()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a supported demo payment method.");
        DeliveryAddress address = request.address();
        List<Order> orders = orderService.createOrders(address, auth.getName(), "DEMO_" + request.method(), "SIMULATED");
        reserveStockOrFail(orders);
        String demoReference = "DEMO-" + UUID.randomUUID().toString().substring(0, 8);
        orders.forEach(order -> order.setPaymentReference(demoReference));
        List<Order> saved = orderRepository.saveAll(orders);
        orderService.clearCart(auth.getName());
        saved.forEach(this::hideSellerPricing);
        return saved;
    }

    @PostMapping("/payment/create-order")
    @Transactional
    public CreatePaymentResponse createPaymentOrder(@RequestBody DeliveryAddress address, Authentication auth) {
        List<Order> drafts = orderService.createOrders(address, auth.getName(), "RAZORPAY", "PENDING");
        long amountPaise = BigDecimal.valueOf(drafts.stream().mapToDouble(o -> o.getTotalAmount()).sum())
                .setScale(2, RoundingMode.HALF_UP).movePointRight(2).longValueExact();
        RazorpayPaymentService.RazorpayOrder remote = razorpay.createOrder(amountPaise);
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.setRazorpayOrderId(remote.id());
        attempt.setBuyerEmail(auth.getName());
        attempt.setAmountPaise(remote.amount());
        try {
            attempt.setOrderSnapshot(mapper.writeValueAsString(drafts));
        } catch (JsonProcessingException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not prepare this order.");
        }
        paymentAttempts.save(attempt);
        return new CreatePaymentResponse(attempt.getId(), remote.id(), remote.amount(), remote.currency(), razorpay.getKeyId());
    }

    @PostMapping("/payment/verify")
    @Transactional
    public Map<String, Object> verifyPayment(@RequestBody VerifyPaymentRequest request, Authentication auth) {
        PaymentAttempt attempt = paymentAttempts.findByRazorpayOrderId(request.razorpayOrderId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment attempt not found."));
        if (!attempt.getBuyerEmail().equalsIgnoreCase(auth.getName()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This payment belongs to another buyer.");
        if ("PAID".equals(attempt.getStatus())) return Map.of("verified", true, "paymentId", attempt.getPaymentId());
        if (!"PENDING".equals(attempt.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This payment attempt is no longer active.");
        if (request.razorpayPaymentId() == null || request.razorpaySignature() == null
                || !razorpay.verifySignature(attempt.getRazorpayOrderId(), request.razorpayPaymentId(), request.razorpaySignature())
                || !razorpay.isCapturedPayment(request.razorpayPaymentId(), attempt.getRazorpayOrderId(), attempt.getAmountPaise()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payment verification failed. No order was placed.");
        try {
            List<Order> paidOrders = mapper.readerForListOf(Order.class).readValue(attempt.getOrderSnapshot());
            if (!reserveStock(paidOrders)) {
                razorpay.refundPayment(request.razorpayPaymentId(), attempt.getAmountPaise());
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        "Stock changed while payment was pending. The captured payment has been refunded.");
            }
            paidOrders.forEach(order -> {
                order.setPaymentMethod("RAZORPAY"); order.setPaymentStatus("PAID");
                order.setPaymentReference(request.razorpayPaymentId()); order.setOrderStatus("Placed");
                order.setOrderDate(LocalDateTime.now());
                if (order.getSellerEmail() != null && order.getTaxableValue() != null) {
                    BigDecimal taxBase = BigDecimal.valueOf(order.getTaxableValue());
                    BigDecimal tcs = taxBase.multiply(new BigDecimal("0.005")).setScale(2, RoundingMode.HALF_UP);
                    order.setTcs(tcs.doubleValue());
                    if (valueOrZero(order.getIgst()) > 0) {
                        order.setTcsCgst(0.0); order.setTcsSgst(0.0); order.setTcsIgst(tcs.doubleValue());
                    } else {
                        BigDecimal half = tcs.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
                        order.setTcsCgst(half.doubleValue()); order.setTcsSgst(tcs.subtract(half).doubleValue()); order.setTcsIgst(0.0);
                    }
                    order.setNetSellerPayout(taxBase.subtract(BigDecimal.valueOf(valueOrZero(order.getMarketplaceCommission())))
                            .subtract(BigDecimal.valueOf(valueOrZero(order.getCommissionGst()))).subtract(tcs).setScale(2, RoundingMode.HALF_UP).doubleValue());
                }
            });
            orderRepository.saveAll(paidOrders);
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not finalize the verified order.");
        }
        attempt.setStatus("PAID"); attempt.setPaymentId(request.razorpayPaymentId()); paymentAttempts.save(attempt);
        orderService.clearCart(auth.getName());
        return Map.of("verified", true, "paymentId", request.razorpayPaymentId());
    }

    @PostMapping("/payment/{attemptId}/cancel")
    @Transactional
    public Map<String, Boolean> cancelPayment(@PathVariable Long attemptId, Authentication auth) {
        PaymentAttempt attempt = paymentAttempts.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment attempt not found."));
        if (!attempt.getBuyerEmail().equalsIgnoreCase(auth.getName()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This payment belongs to another buyer.");
        if ("PENDING".equals(attempt.getStatus())) { attempt.setStatus("CANCELLED"); paymentAttempts.save(attempt); }
        return Map.of("cancelled", true);
    }

    @GetMapping("/my-orders")
    public List<Order> getMyOrders(Authentication auth) {
        List<Order> orders = orderRepository.findByBuyerEmailOrderByOrderDateDesc(auth.getName());
        orders.forEach(this::hideSellerPricing);
        return orders;
    }

    @PostMapping("/{id}/cancel")
    @Transactional
    public Order cancelBuyerOrder(@PathVariable Long id, Authentication auth) {
        Order order = orderRepository.findByIdForBuyerUpdate(id, auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found in your account."));
        if ("Cancelled".equalsIgnoreCase(order.getOrderStatus())) { hideSellerPricing(order); return order; }
        if (!List.of("Placed", "Processing").contains(order.getOrderStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order can no longer be cancelled. Contact the seller for help.");
        if ("PAID".equalsIgnoreCase(order.getPaymentStatus())) {
            if ("RAZORPAY".equalsIgnoreCase(order.getPaymentMethod())) {
                long amountPaise = BigDecimal.valueOf(valueOrZero(order.getTotalAmount())).movePointRight(2).setScale(0, RoundingMode.HALF_UP).longValueExact();
                RazorpayPaymentService.Refund refund = razorpay.refundPayment(order.getPaymentReference(), amountPaise);
                order.setPaymentStatus("processed".equalsIgnoreCase(refund.status()) ? "REFUNDED" : "REFUND_PENDING");
            } else if (order.getPaymentMethod() != null && order.getPaymentMethod().startsWith("DEMO_")) {
                order.setPaymentStatus("REFUNDED");
            } else {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "This paid order needs a refund review. Contact support to cancel it.");
            }
        }
        order.setOrderStatus("Cancelled");
        Order saved = orderRepository.save(order);
        releaseStock(order);
        hideSellerPricing(saved);
        return saved;
    }

    @GetMapping("/seller/orders")
    public List<Order> getSellerOrders(Authentication auth) {
        return orderRepository.findBySellerEmailOrderByOrderDateDesc(auth.getName());
    }

    @GetMapping("/admin/all")
    public List<Order> getAllOrders() { return orderRepository.findAllByOrderByOrderDateDesc(); }

    @GetMapping("/admin/tax-ledger")
    public Map<String, Object> taxLedger() {
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc().stream()
                .filter(order -> !"Cancelled".equalsIgnoreCase(order.getOrderStatus())).toList();
        return Map.ofEntries(
                Map.entry("gstCollected", sum(orders, Order::getGst)),
                Map.entry("taxableValue", sum(orders, Order::getTaxableValue)),
                Map.entry("cgst", sum(orders, Order::getCgst)), Map.entry("sgst", sum(orders, Order::getSgst)),
                Map.entry("igst", sum(orders, Order::getIgst)), Map.entry("tcs", sum(orders, Order::getTcs)),
                Map.entry("tcsCgst", sum(orders, Order::getTcsCgst)), Map.entry("tcsSgst", sum(orders, Order::getTcsSgst)),
                Map.entry("tcsIgst", sum(orders, Order::getTcsIgst)), Map.entry("commission", sum(orders, Order::getMarketplaceCommission)),
                Map.entry("commissionGst", sum(orders, Order::getCommissionGst)),
                Map.entry("orders", orders.size()), Map.entry("notice", "Demo and legacy orders are estimates; only captured marketplace payments incur TCS in this ledger.")
        );
    }

    @PatchMapping("/seller/{id}/status")
    @Transactional
    public Order updateSellerOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getSellerEmail() == null || !order.getSellerEmail().equalsIgnoreCase(auth.getName()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This order is not assigned to your shop.");
        if ("PENDING".equalsIgnoreCase(order.getPaymentStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "This order is awaiting payment verification.");
        boolean wasCancelled = "Cancelled".equalsIgnoreCase(order.getOrderStatus());
        String nextStatus = validateStatus(body.get("status"));
        if (wasCancelled && !"Cancelled".equalsIgnoreCase(nextStatus) && !reserveStock(List.of(order)))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order cannot be reopened because there is not enough stock.");
        order.setOrderStatus(nextStatus);
        if (!wasCancelled && "Cancelled".equalsIgnoreCase(nextStatus)) releaseStock(order);
        Order saved = orderRepository.save(order); saved.setProductCostPrice(null); return saved;
    }

    @PatchMapping("/admin/{id}/status")
    @Transactional
    public Order updateAdminOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if ("PENDING".equalsIgnoreCase(order.getPaymentStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "This order is awaiting payment verification.");
        boolean wasCancelled = "Cancelled".equalsIgnoreCase(order.getOrderStatus());
        String nextStatus = validateStatus(body.get("status"));
        if (wasCancelled && !"Cancelled".equalsIgnoreCase(nextStatus) && !reserveStock(List.of(order)))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This order cannot be reopened because there is not enough stock.");
        order.setOrderStatus(nextStatus);
        if (!wasCancelled && "Cancelled".equalsIgnoreCase(nextStatus)) releaseStock(order);
        Order saved = orderRepository.save(order); saved.setProductCostPrice(null); return saved;
    }

    private boolean reserveStock(List<Order> orders) {
        for (Order order : orders) {
            if (!stock.reserve(order.getProductId(), order.getQuantity() == null ? 0 : order.getQuantity())) return false;
        }
        return true;
    }
    private void reserveStockOrFail(List<Order> orders) {
        for (Order order : orders) {
            if (!stock.reserve(order.getProductId(), order.getQuantity() == null ? 0 : order.getQuantity()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,
                        order.getProductName() + " does not have enough stock.");
        }
    }
    private void releaseStock(Order order) {
        stock.release(order.getProductId(), order.getQuantity() == null ? 0 : order.getQuantity());
    }
    private void hideSellerPricing(Order order) {
        order.setProductCostPrice(null);
        order.setProductOperatingCost(null);
        order.setProductPlatformFeePercent(null);
    }
    private double sum(List<Order> orders, java.util.function.Function<Order, Double> field) {
        return orders.stream().map(field).filter(java.util.Objects::nonNull).mapToDouble(Double::doubleValue).sum();
    }
    private double valueOrZero(Double value) { return value == null ? 0.0 : value; }
    private String validateStatus(String status) {
        if (status == null || !List.of("Placed", "Processing", "Shipped", "Delivered", "Cancelled").contains(status))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order status.");
        return status;
    }

    public record DemoPaymentRequest(DeliveryAddress address, String method) {}
    public record PaymentConfig(boolean razorpayEnabled, String keyId, boolean demoPaymentEnabled) {}
    public record CreatePaymentResponse(Long attemptId, String orderId, Long amount, String currency, String keyId) {}
    public record VerifyPaymentRequest(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {}
}
