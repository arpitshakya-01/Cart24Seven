package EasyCart.Backend.repository;

import EasyCart.Backend.entity.Cart;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@Repository
public class CartRepository {
    private final JdbcRepositorySupport jdbc;
    public CartRepository(JdbcRepositorySupport jdbc) { this.jdbc = jdbc; }

    public Optional<Cart> findByBuyerEmailIgnoreCase(String email) {
        return jdbc.queryOne("SELECT id,buyer_email FROM carts WHERE LOWER(buyer_email)=LOWER(?) LIMIT 1", this::map, email);
    }

    public Cart save(Cart cart) {
        if (cart.getId() == null) {
            cart.setId(jdbc.insert("INSERT INTO carts (buyer_email) VALUES (?)", cart.getBuyerEmail()));
        } else if (jdbc.update("UPDATE carts SET buyer_email=? WHERE id=?", cart.getBuyerEmail(), cart.getId()) == 0) {
            throw new EmptyResultDataAccessException("Cart not found", 1);
        }
        return cart;
    }

    private Cart map(ResultSet row) throws SQLException {
        Cart cart = new Cart(row.getString("buyer_email"));
        cart.setId(row.getLong("id"));
        return cart;
    }
}
