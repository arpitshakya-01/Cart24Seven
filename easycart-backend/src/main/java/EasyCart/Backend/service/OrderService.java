package EasyCart.Backend.service;

import EasyCart.Backend.dto.DeliveryAddress;
import EasyCart.Backend.entity.Cart;
import EasyCart.Backend.entity.CartItem;
import EasyCart.Backend.entity.Order;
import EasyCart.Backend.entity.Product;
import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.CartItemRepository;
import EasyCart.Backend.repository.CartRepository;
import EasyCart.Backend.repository.UserRepository;
import EasyCart.Backend.utils.DeliveryChargeCalculator;
import EasyCart.Backend.utils.ProductPricing;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {
    private final CartRepository carts;
    private final CartItemRepository cartItems;
    private final UserRepository users;

    public OrderService(CartRepository carts, CartItemRepository cartItems, UserRepository users) {
        this.carts = carts;
        this.cartItems = cartItems;
        this.users = users;
    }

    public List<Order> createOrders(DeliveryAddress address, String buyerEmail, String method, String paymentStatus) {
        validateAddress(address);
        Cart cart = carts.findByBuyerEmailIgnoreCase(buyerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Your cart is empty."));
        List<CartItem> items = cartItems.findByCart_Id(cart.getId());
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
        List<Order> orders = new ArrayList<>();
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
            order.setSellerGstin(sellerGstin); order.setQuantity(item.getQuantity());
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

    public void validateAddress(DeliveryAddress address) {
        if (address == null || blank(address.fullName()) || blank(address.phone()) || blank(address.addressLine())
                || blank(address.city()) || blank(address.state()) || blank(address.pincode()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Complete the delivery address before placing an order.");
    }

    public void clearCart(String buyerEmail) {
        carts.findByBuyerEmailIgnoreCase(buyerEmail)
                .ifPresent(cart -> cartItems.deleteByCart_Id(cart.getId()));
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
    private String normalizeState(String value) { return value == null ? "" : value.toLowerCase().replaceAll("[^a-z]", ""); }
}
