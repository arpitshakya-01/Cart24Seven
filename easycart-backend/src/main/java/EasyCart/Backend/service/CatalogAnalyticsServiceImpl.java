package EasyCart.Backend.service;

import EasyCart.Backend.dto.CatalogSummary;
import EasyCart.Backend.entity.Product;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
public class CatalogAnalyticsServiceImpl implements CatalogAnalyticsService {
    private static final int LOW_STOCK_THRESHOLD = 5;
    private final ConcurrentCatalogReader reader;

    public CatalogAnalyticsServiceImpl(ConcurrentCatalogReader reader) {
        this.reader = reader;
    }

    @Override
    public CatalogSummary createConcurrentSummary() {
        CompletableFuture<ConcurrentCatalogReader.ReadResult<Product>> products = reader.readProducts();
        CompletableFuture<ConcurrentCatalogReader.ReadResult<EasyCart.Backend.entity.Category>> categories = reader.readCategories();
        CompletableFuture.allOf(products, categories).join();

        var productResult = products.join();
        var categoryResult = categories.join();
        int outOfStock = (int) productResult.rows().stream()
                .filter(product -> product.getStock() != null && product.getStock() == 0).count();
        int lowStock = (int) productResult.rows().stream()
                .filter(this::isLowStock).count();

        return new CatalogSummary(productResult.rows().size(), categoryResult.rows().size(), lowStock,
                outOfStock, List.of(productResult.workerThread(), categoryResult.workerThread()));
    }

    private boolean isLowStock(Product product) {
        return product.getStock() != null && product.getStock() > 0 && product.getStock() <= LOW_STOCK_THRESHOLD;
    }
}

