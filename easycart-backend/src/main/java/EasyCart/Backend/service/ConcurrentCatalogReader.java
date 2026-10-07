package EasyCart.Backend.service;

import EasyCart.Backend.entity.Category;
import EasyCart.Backend.entity.Product;
import EasyCart.Backend.repository.CategoryRepository;
import EasyCart.Backend.repository.ProductRepository;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.concurrent.CompletableFuture;

@Component
public class ConcurrentCatalogReader {
    private final ProductRepository products;
    private final CategoryRepository categories;

    public ConcurrentCatalogReader(ProductRepository products, CategoryRepository categories) {
        this.products = products;
        this.categories = categories;
    }

    @Async("catalogExecutor")
    public CompletableFuture<ReadResult<Product>> readProducts() {
        return CompletableFuture.completedFuture(new ReadResult<>(products.findAll(), Thread.currentThread().getName()));
    }

    @Async("catalogExecutor")
    public CompletableFuture<ReadResult<Category>> readCategories() {
        return CompletableFuture.completedFuture(new ReadResult<>(categories.findAll(), Thread.currentThread().getName()));
    }

    public record ReadResult<T>(List<T> rows, String workerThread) {}
}
