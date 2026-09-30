package EasyCart.Backend.controller;

import EasyCart.Backend.entity.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/** Listing price: seller fee and margin are calculated on taxable value; buyer price includes GST. */
public final class ProductPricing {
    public static final double DEFAULT_PLATFORM_FEE_PERCENT = 8.0;
    public static final double DEFAULT_PROFIT_MARGIN_PERCENT = 20.0;
    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100");
    private static final BigDecimal CENT = new BigDecimal("0.01");

    private ProductPricing() {}

    public static void apply(Product product) {
        double cost = value(product.getCostPrice(), 0.0);
        double operating = value(product.getOperatingCost(), 0.0);
        double feePercent = value(product.getPlatformFeePercent(), DEFAULT_PLATFORM_FEE_PERCENT);
        double marginPercent = value(product.getProfitMarginPercent(), DEFAULT_PROFIT_MARGIN_PERCENT);
        int discount = product.getDiscount() == null ? 0 : product.getDiscount();
        double gstRate = value(product.getGstRate(), 18.0);
        if (cost <= 0 || operating < 0) throw new IllegalArgumentException("Product cost must be above zero; operating cost cannot be negative.");
        if (feePercent < 0 || feePercent > 50) throw new IllegalArgumentException("Platform fee must be between 0% and 50%.");
        if (marginPercent < 0 || marginPercent > 90 || feePercent + marginPercent >= 100)
            throw new IllegalArgumentException("Profit margin and platform fee must be valid and total less than 100%.");
        if (discount < 0 || discount > 90) throw new IllegalArgumentException("Discount must be between 0% and 90%.");
        if (!List.of(0.0, 0.25, 1.0, 1.5, 3.0, 5.0, 12.0, 18.0, 28.0, 40.0).contains(gstRate))
            throw new IllegalArgumentException("Choose the applicable GST rate for this product's HSN code.");

        BigDecimal baseCost = BigDecimal.valueOf(cost).add(BigDecimal.valueOf(operating));
        BigDecimal keepRate = BigDecimal.ONE
                .subtract(BigDecimal.valueOf(feePercent).movePointLeft(2))
                .subtract(BigDecimal.valueOf(marginPercent).movePointLeft(2));
        BigDecimal requiredSalePrice = baseCost.divide(keepRate, 8, RoundingMode.UP);
        BigDecimal taxablePrice = charmPrice(requiredSalePrice);
        BigDecimal salePrice = taxablePrice.multiply(BigDecimal.ONE.add(BigDecimal.valueOf(gstRate).movePointLeft(2)))
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal mrp = discount == 0
                ? salePrice
                : salePrice.divide(BigDecimal.ONE.subtract(BigDecimal.valueOf(discount).movePointLeft(2)), 2, RoundingMode.UP);

        product.setCostPrice(cost);
        product.setOperatingCost(operating);
        product.setPlatformFeePercent(feePercent);
        product.setProfitMarginPercent(marginPercent);
        product.setDiscount(discount);
        product.setGstRate(gstRate);
        product.setBasePrice(taxablePrice.doubleValue());
        product.setPrice(salePrice.doubleValue());
        product.setMrp(mrp.doubleValue());
    }

    private static BigDecimal charmPrice(BigDecimal amount) {
        BigDecimal nextWhole = amount.setScale(0, RoundingMode.CEILING);
        BigDecimal charm = nextWhole.subtract(CENT);
        if (charm.compareTo(amount) < 0) charm = charm.add(BigDecimal.ONE);
        return charm.max(CENT).setScale(2, RoundingMode.UNNECESSARY);
    }

    private static double value(Double number, double fallback) { return number == null ? fallback : number; }
}
