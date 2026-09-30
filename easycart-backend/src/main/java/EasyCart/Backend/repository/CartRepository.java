package EasyCart.Backend.repository;

import EasyCart.Backend.entity.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    Optional<Cart> findByBuyerEmailIgnoreCase(String buyerEmail);
}
