package EasyCart.Backend.controller;

import EasyCart.Backend.entity.Cart;
import EasyCart.Backend.entity.CartItem;
import EasyCart.Backend.entity.Order;
import EasyCart.Backend.entity.PaymentAttempt;
import EasyCart.Backend.entity.Product;
import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.CartItemRepository;
import EasyCart.Backend.repository.CartRepository;
import EasyCart.Backend.repository.OrderRepository;
import EasyCart.Backend.repository.PaymentAttemptRepository;
import EasyCart.Backend.repository.UserRepository;
import EasyCart.Backend.service.RazorpayPaymentService;
import EasyCart.Backend.utils.DeliveryChargeCalculator;
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
@CrossOrigin(origins = "http://localhost:5173")
public class OrderController {
    private final OrderRepository orderRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final PaymentAttemptRepository paymentAttempts;
    private final RazorpayPaymentService razorpay;
    private final UserRepository users;
    private final ObjectMapper mapper;
    @Value("${app.payment.demo.enabled:false}") private boolean demoPaymentsEnabled;

    public OrderController(OrderRepository orderRepository, CartRepository cartRepository,
                           CartItemRepository cartItemRepository, PaymentAttemptRepository paymentAttempts,
                           RazorpayPaymentService razorpay, ObjectMapper mapper, UserRepository users) {
        this.orderRepository = orderRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.paymentAttempts = paymentAttempts;
        this.razorpay = razorpay;
        this.mapper = mapper;
        this.users = users;
    }

    @PostMapping("/place")
    @Transactional
    public List<Order> placeCashOnDelivery(@RequestBody DeliveryAddress address, Authentication auth) {
        validateAddress(address);
        List<Order> orders = buildOrders(address, auth.getName(), "COD", "UNPAID");
        List<Order> saved = orderRepository.saveAll(orders);
        clearCart(auth.getName());
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
        validateAddress(address);
        List<Order> orders = buildOrders(address, auth.getName(), "DEMO_" + request.method(), "SIMULATED");
        String demoReference = "DEMO-" + UUID.randomUUID().toString().substring(0, 8);
        orders.forEach(order -> order.setPaymentReference(demoReference));
        List<Order> saved = orderRepository.saveAll(orders);
        clearCart(auth.getName());
        saved.forEach(this::hideSellerPricing);
        return saved;
    }

    @PostMapping("/payment/create-order")
    @Transactional
    public CreatePaymentResponse createPaymentOrder(@RequestBody DeliveryAddress address, Authentication auth) {
        validateAddress(address);
        List<Order> drafts = buildOrders(address, auth.getName(), "RAZORPAY", "PENDING");
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
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not finalize the verified order.");
        }
        attempt.setStatus("PAID"); attempt.setPaymentId(request.razorpayPaymentId()); paymentAttempts.save(attempt);
        clearCart(auth.getName());
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
    public Order updateSellerOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getSellerEmail() == null || !order.getSellerEmail().equalsIgnoreCase(auth.getName()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This order is not assigned to your shop.");
        if ("PENDING".equalsIgnoreCase(order.getPaymentStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "This order is awaiting payment verification.");
        order.setOrderStatus(validateStatus(body.get("status")));
        Order saved = orderRepository.save(order); saved.setProductCostPrice(null); return saved;
    }

    @PatchMapping("/admin/{id}/status")
    public Order updateAdminOrderStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Order order = orderRepository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if ("PENDING".equalsIgnoreCase(order.getPaymentStatus())) throw new ResponseStatusException(HttpStatus.CONFLICT, "This order is awaiting payment verification.");
        order.setOrderStatus(validateStatus(body.get("status")));
        Order saved = orderRepository.save(order); saved.setProductCostPrice(null); return saved;
    }

    private List<Order> buildOrders(DeliveryAddress address, String buyerEmail, String method, String paymentStatus) {
        Cart cart = cartRepository.findByBuyerEmailIgnoreCase(buyerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty."));
        List<CartItem> items = cartItemRepository.findByCart_Id(cart.getId());
        if (items.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty.");
        BigDecimal subtotalAll = BigDecimal.ZERO;
        for (CartItem item : items) {
            Product product = item.getProduct();
            if (item.getQuantity() == null || item.getQuantity() < 1 || product.getPrice() == null || product.getPrice() < 0)
                throw new ResponseStatusException(HttpStatus.CONFLICT, "A cart item has invalid quantity or price.");
            if (product.getStock() == null || item.getQuantity() > product.getStock())
                throw new ResponseStatusException(HttpStatus.CONFLICT, product.getProductName() + " does not have enough stock.");
            subtotalAll = subtotalAll.add(BigDecimal.valueOf(product.getPrice()).multiply(BigDecimal.valueOf(item.getQuantity())));
        }
        subtotalAll = subtotalAll.setScale(2, RoundingMode.HALF_UP);
        BigDecimal deliveryAll = DeliveryChargeCalculator.calculateDeliveryCharge(subtotalAll);
        boolean deliveryAssigned = false;
        LocalDateTime now = LocalDateTime.now();
        java.util.ArrayList<Order> orders = new java.util.ArrayList<>();
        for (CartItem item : items) {
            Product product = item.getProduct();
            BigDecimal lineSubtotal = BigDecimal.valueOf(product.getPrice()).multiply(BigDecimal.valueOf(item.getQuantity())).setScale(2, RoundingMode.HALF_UP);
            double gstRate = product.getGstRate() == null ? 18.0 : product.getGstRate();
            BigDecimal gst = lineSubtotal.multiply(BigDecimal.valueOf(gstRate))
                    .divide(BigDecimal.valueOf(100.0 + gstRate), 2, RoundingMode.HALF_UP);
            BigDecimal taxable = lineSubtotal.subtract(gst).setScale(2, RoundingMode.HALF_UP);
            User seller = product.getSellerEmail() == null ? null : users.findByEmailIgnoreCase(product.getSellerEmail()).orElse(null);
            if (product.getSellerEmail() != null && (seller == null || !"VERIFIED".equalsIgnoreCase(seller.getGstinStatus())
                    || !product.isHsnVerified() || product.getHsnCode() == null || product.getHsnCode().isBlank()))
                throw new ResponseStatusException(HttpStatus.CONFLICT, product.getProductName() + " is not available until seller GSTIN and HSN details are verified by an admin.");
            String sellerState = seller == null ? address.state().trim() : (seller.getState() == null ? "" : seller.getState().trim());
            if (seller != null && sellerState.isBlank())
                throw new ResponseStatusException(HttpStatus.CONFLICT, "The seller must submit a registered business state before this order can be taxed correctly.");
            String sellerGstin = seller == null ? "" : (seller.getGstin() == null ? "" : seller.getGstin());
            boolean intrastate = !sellerState.isBlank() && normalizeState(sellerState).equals(normalizeState(address.state()));
            BigDecimal cgst = intrastate ? gst.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal sgst = intrastate ? gst.subtract(cgst) : BigDecimal.ZERO;
            BigDecimal igst = intrastate ? BigDecimal.ZERO : gst;
            double feeRate = product.getPlatformFeePercent() == null ? ProductPricing.DEFAULT_PLATFORM_FEE_PERCENT : product.getPlatformFeePercent();
            BigDecimal commission = taxable.multiply(BigDecimal.valueOf(feeRate)).movePointLeft(2).setScale(2, RoundingMode.HALF_UP);
            BigDecimal commissionGst = commission.multiply(new BigDecimal("0.18")).setScale(2, RoundingMode.HALF_UP);
            boolean platformCollected = "PAID".equalsIgnoreCase(paymentStatus) && "RAZORPAY".equalsIgnoreCase(method);
            BigDecimal tcs = product.getSellerEmail() != null && platformCollected
                    ? taxable.multiply(new BigDecimal("0.005")).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal tcsHalf = intrastate && tcs.signum() > 0 ? tcs.divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            BigDecimal payout = taxable.subtract(commission).subtract(commissionGst).subtract(tcs).setScale(2, RoundingMode.HALF_UP);
            BigDecimal delivery = deliveryAssigned ? BigDecimal.ZERO : deliveryAll;
            deliveryAssigned = true;
            Order order = new Order();
            order.setCustomerName(address.fullName().trim()); order.setPhone(address.phone().trim());
            order.setAddress(address.addressLine().trim()); order.setCity(address.city().trim());
            order.setState(address.state().trim()); order.setPincode(address.pincode().trim());
            order.setProductId(product.getId()); order.setProductName(product.getProductName()); order.setProductImage(product.getImageUrl());
            order.setProductPrice(product.getPrice()); order.setProductCostPrice(product.getCostPrice());
            order.setProductOperatingCost(product.getOperatingCost()); order.setProductPlatformFeePercent(product.getPlatformFeePercent());
            order.setGstRate(gstRate); order.setHsnCode(product.getHsnCode()); order.setSellerState(sellerState);
            order.setSellerGstin(sellerGstin);
            order.setQuantity(item.getQuantity());
            order.setSubtotal(lineSubtotal.doubleValue()); order.setTaxableValue(taxable.doubleValue()); order.setGst(gst.doubleValue());
            order.setCgst(cgst.doubleValue()); order.setSgst(sgst.doubleValue()); order.setIgst(igst.doubleValue());
            order.setMarketplaceCommission(commission.doubleValue()); order.setCommissionGst(commissionGst.doubleValue());
            order.setTcs(tcs.doubleValue()); order.setTcsCgst(tcsHalf.doubleValue());
            order.setTcsSgst(intrastate ? tcs.subtract(tcsHalf).doubleValue() : 0.0); order.setTcsIgst(intrastate ? 0.0 : tcs.doubleValue());
            order.setNetSellerPayout(payout.doubleValue()); order.setDeliveryCharge(delivery.doubleValue());
            order.setTotalAmount(lineSubtotal.add(delivery).doubleValue()); order.setBuyerEmail(buyerEmail);
            order.setSellerEmail(product.getSellerEmail()); order.setOrderStatus("Placed"); order.setOrderDate(now);
            order.setPaymentMethod(method); order.setPaymentStatus(paymentStatus); orders.add(order);
        }
        return orders;
    }

    private void clearCart(String buyerEmail) {
        cartRepository.findByBuyerEmailIgnoreCase(buyerEmail).ifPresent(cart -> cartItemRepository.deleteByCart_Id(cart.getId()));
    }
    private void hideSellerPricing(Order order) {
        order.setProductCostPrice(null);
        order.setProductOperatingCost(null);
        order.setProductPlatformFeePercent(null);
    }
    private void validateAddress(DeliveryAddress address) {
        if (address == null || blank(address.fullName()) || blank(address.phone()) || blank(address.addressLine())
                || blank(address.city()) || blank(address.state()) || blank(address.pincode()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complete the delivery address before placing your order.");
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
    private String normalizeState(String value) { return value == null ? "" : value.toLowerCase().replaceAll("[^a-z]", ""); }
    private double sum(List<Order> orders, java.util.function.Function<Order, Double> field) {
        return orders.stream().map(field).filter(java.util.Objects::nonNull).mapToDouble(Double::doubleValue).sum();
    }
    private double valueOrZero(Double value) { return value == null ? 0.0 : value; }
    private String validateStatus(String status) {
        if (status == null || !List.of("Placed", "Processing", "Shipped", "Delivered", "Cancelled").contains(status))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid order status.");
        return status;
    }

    public record DeliveryAddress(String fullName, String phone, String addressLine, String city, String state, String pincode) {}
    public record DemoPaymentRequest(DeliveryAddress address, String method) {}
    public record PaymentConfig(boolean razorpayEnabled, String keyId, boolean demoPaymentEnabled) {}
    public record CreatePaymentResponse(Long attemptId, String orderId, Long amount, String currency, String keyId) {}
    public record VerifyPaymentRequest(String razorpayOrderId, String razorpayPaymentId, String razorpaySignature) {}
}
