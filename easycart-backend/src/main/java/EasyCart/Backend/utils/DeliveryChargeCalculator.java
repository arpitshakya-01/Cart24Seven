package EasyCart.Backend.utils;

import java.math.BigDecimal;

/** Calculates the buyer's delivery charge from the complete order value. */
public final class DeliveryChargeCalculator {
    private static final BigDecimal FREE_DELIVERY_THRESHOLD = new BigDecimal("499.00");
    private static final BigDecimal DELIVERY_CHARGE = new BigDecimal("40.00");

    private DeliveryChargeCalculator() {
    }

    public static BigDecimal calculateDeliveryCharge(BigDecimal orderAmount) {
        if (orderAmount == null) {
            throw new IllegalArgumentException("Order amount cannot be null.");
        }
        if (orderAmount.signum() < 0) {
            throw new IllegalArgumentException("Order amount cannot be negative.");
        }
        return orderAmount.compareTo(FREE_DELIVERY_THRESHOLD) < 0
                ? DELIVERY_CHARGE
                : BigDecimal.ZERO.setScale(2);
    }

    public static void main(String[] args) {
        BigDecimal[] sampleAmounts = {
                new BigDecimal("0.00"),
                new BigDecimal("498.99"),
                new BigDecimal("499.00"),
                new BigDecimal("750.00")
        };

        for (BigDecimal amount : sampleAmounts) {
            System.out.printf("Order: ₹%s -> Delivery: ₹%s%n",
                    amount.toPlainString(), calculateDeliveryCharge(amount).toPlainString());
        }
    }
}
