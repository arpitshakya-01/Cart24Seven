package EasyCart.Backend.service;

import EasyCart.Backend.repository.JdbcRepositorySupport;
import org.springframework.stereotype.Service;

@Service
public class StockService {
    private final JdbcRepositorySupport jdbc;

    public StockService(JdbcRepositorySupport jdbc) {
        this.jdbc = jdbc;
    }

    /**
     * The conditional update makes the reservation safe across application instances.
     * Synchronization also makes the in-process critical section explicit for the
     * project's concurrency demonstration.
     */
    public synchronized boolean reserve(Long productId, int quantity) {
        if (productId == null || quantity < 1) return false;
        return jdbc.update("UPDATE products SET stock=stock-? WHERE id=? AND stock>=?",
                quantity, productId, quantity) == 1;
    }

    public synchronized void release(Long productId, int quantity) {
        if (productId != null && quantity > 0)
            jdbc.update("UPDATE products SET stock=stock+? WHERE id=?", quantity, productId);
    }
}
