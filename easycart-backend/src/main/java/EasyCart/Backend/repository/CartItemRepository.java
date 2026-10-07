package EasyCart.Backend.repository;

import EasyCart.Backend.entity.Cart;
import EasyCart.Backend.entity.CartItem;
import EasyCart.Backend.entity.Category;
import EasyCart.Backend.entity.Product;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class CartItemRepository {
    private static final String SELECT = "SELECT ci.id AS cart_item_id,ci.cart_id,ci.quantity," +
            "p.*,c.id AS joined_category_id,c.category_name AS joined_category_name,c.description AS joined_category_description " +
            "FROM cart_items ci JOIN products p ON p.id=ci.product_id LEFT JOIN categories c ON c.id=p.category_id";
    private final JdbcRepositorySupport jdbc;

    public CartItemRepository(JdbcRepositorySupport jdbc) { this.jdbc = jdbc; }

    public List<CartItem> findByCart_Id(Long cartId) {
        return jdbc.query(SELECT + " WHERE ci.cart_id=? ORDER BY ci.id", this::map, cartId);
    }

    public Optional<CartItem> findByCart_IdAndProduct_Id(Long cartId, Long productId) {
        return jdbc.queryOne(SELECT + " WHERE ci.cart_id=? AND p.id=? LIMIT 1", this::map, cartId, productId);
    }

    public CartItem save(CartItem item) {
        if (item.getId() == null) {
            item.setId(jdbc.insert("INSERT INTO cart_items (cart_id,product_id,quantity) VALUES (?,?,?)",
                    item.getCart().getId(), item.getProduct().getId(), item.getQuantity()));
        } else if (jdbc.update("UPDATE cart_items SET cart_id=?,product_id=?,quantity=? WHERE id=?",
                item.getCart().getId(), item.getProduct().getId(), item.getQuantity(), item.getId()) == 0) {
            throw new EmptyResultDataAccessException("Cart item not found", 1);
        }
        return item;
    }

    public void delete(CartItem item) { jdbc.update("DELETE FROM cart_items WHERE id=?", item.getId()); }
    public void deleteByCart_Id(Long cartId) { jdbc.update("DELETE FROM cart_items WHERE cart_id=?", cartId); }

    private CartItem map(ResultSet row) throws SQLException {
        Cart cart = new Cart();
        cart.setId(row.getLong("cart_id"));
        CartItem item = new CartItem();
        item.setId(row.getLong("cart_item_id"));
        item.setCart(cart);
        item.setQuantity(row.getInt("quantity"));
        item.setProduct(mapProduct(row));
        return item;
    }

    private Product mapProduct(ResultSet row) throws SQLException {
        Product p = new Product();
        p.setId(row.getLong("id"));
        p.setProductName(row.getString("product_name"));
        p.setBrand(row.getString("brand"));
        p.setDescription(row.getString("description"));
        p.setImageUrl(row.getString("image_url"));
        p.setPrice(JdbcRepositorySupport.nullableDouble(row,"price"));
        p.setBasePrice(JdbcRepositorySupport.nullableDouble(row,"base_price"));
        p.setGstRate(JdbcRepositorySupport.nullableDouble(row,"gst_rate"));
        p.setHsnCode(row.getString("hsn_code"));
        p.setHsnVerified(row.getBoolean("hsn_verified"));
        p.setMrp(JdbcRepositorySupport.nullableDouble(row,"mrp"));
        p.setCostPrice(JdbcRepositorySupport.nullableDouble(row,"cost_price"));
        p.setOperatingCost(JdbcRepositorySupport.nullableDouble(row,"operating_cost"));
        p.setPlatformFeePercent(JdbcRepositorySupport.nullableDouble(row,"platform_fee_percent"));
        p.setProfitMarginPercent(JdbcRepositorySupport.nullableDouble(row,"profit_margin_percent"));
        p.setRating(JdbcRepositorySupport.nullableDouble(row,"rating"));
        p.setStock(JdbcRepositorySupport.nullableInt(row,"stock"));
        p.setDiscount(JdbcRepositorySupport.nullableInt(row,"discount"));
        p.setSellerEmail(row.getString("seller_email"));
        long categoryId = row.getLong("joined_category_id");
        if (!row.wasNull()) {
            Category category = new Category();
            category.setId(categoryId);
            category.setCategoryName(row.getString("joined_category_name"));
            category.setDescription(row.getString("joined_category_description"));
            p.setCategory(category);
        }
        return p;
    }
}

