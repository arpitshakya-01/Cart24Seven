package EasyCart.Backend.dto;

import java.util.List;

public record CatalogSummary(
        int productCount,
        int categoryCount,
        int lowStockProductCount,
        int outOfStockProductCount,
        List<String> workerThreads) {}
