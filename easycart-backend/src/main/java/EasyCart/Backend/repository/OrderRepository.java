package EasyCart.Backend.repository;

import EasyCart.Backend.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findAllByOrderByOrderDateDesc();
    List<Order> findByBuyerEmailOrderByOrderDateDesc(String buyerEmail);
    List<Order> findBySellerEmailOrderByOrderDateDesc(String sellerEmail);
}
