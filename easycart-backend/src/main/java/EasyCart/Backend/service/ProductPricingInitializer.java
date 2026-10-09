package EasyCart.Backend.service;

import EasyCart.Backend.entity.Product;
import EasyCart.Backend.repository.ProductRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import EasyCart.Backend.utils.ProductPricing;

import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;

/** One-time compatibility migration for existing listings with a recorded unit cost. */
@Component
public class ProductPricingInitializer implements ApplicationRunner {
    private final ProductRepository products;

    public ProductPricingInitializer(ProductRepository products) { this.products = products; }

    @Override
    public void run(ApplicationArguments args) {
        List<Product> unpriced = products.findAll().stream()
                .filter(product -> product.getBasePrice() == null)
                .toList();
        for (Product product : unpriced) {
            if (product.getPlatformFeePercent() == null && product.getCostPrice() != null && product.getCostPrice() > 0
                    && (product.getDiscount() == null || product.getDiscount() <= 90)) {
                ProductPricing.apply(product);
            } else if (product.getPrice() != null && product.getPrice() >= 0) {
                double rate = product.getGstRate() == null ? 18.0 : product.getGstRate();
                product.setGstRate(rate);
                product.setBasePrice(product.getPrice());
                BigDecimal inclusive = BigDecimal.valueOf(product.getPrice()).multiply(BigDecimal.ONE.add(BigDecimal.valueOf(rate).movePointLeft(2))).setScale(2, RoundingMode.HALF_UP);
                BigDecimal mrp = BigDecimal.valueOf(product.getMrp() == null ? product.getPrice() : product.getMrp())
                        .multiply(BigDecimal.ONE.add(BigDecimal.valueOf(rate).movePointLeft(2))).setScale(2, RoundingMode.HALF_UP);
                product.setPrice(inclusive.doubleValue());
                product.setMrp(mrp.doubleValue());
            }
        }
        if (!unpriced.isEmpty()) products.saveAll(unpriced);
    }
}
