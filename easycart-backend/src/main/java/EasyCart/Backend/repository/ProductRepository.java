package EasyCart.Backend.repository;

import EasyCart.Backend.entity.Category;
import EasyCart.Backend.entity.Product;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class ProductRepository {
    private static final String SELECT = "SELECT p.*, c.id AS joined_category_id, c.category_name AS joined_category_name, c.description AS joined_category_description, (SELECT AVG(r.rating) FROM product_reviews r WHERE r.product_id=p.id) AS customer_rating, (SELECT COUNT(*) FROM product_reviews r WHERE r.product_id=p.id) AS review_count FROM products p LEFT JOIN categories c ON c.id=p.category_id";
    private final JdbcRepositorySupport jdbc;
    private final ProductMediaRepository mediaRepository;

    public ProductRepository(JdbcRepositorySupport jdbc, ProductMediaRepository mediaRepository) { this.jdbc = jdbc; this.mediaRepository=mediaRepository; }

    @Transactional
    public Product save(Product product) {
        Object categoryId = product.getCategory() == null ? null : product.getCategory().getId();
        Object[] values = values(product, categoryId);
        if (product.getId() == null) {
            product.setId(jdbc.insert("INSERT INTO products (product_name,brand,description,image_url,price,base_price,gst_rate,hsn_code,hsn_verified,mrp,cost_price,operating_cost,platform_fee_percent,profit_margin_percent,rating,stock,discount,seller_email,category_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", values));
        } else {
            Object[] updateValues = java.util.Arrays.copyOf(values, values.length + 1);
            updateValues[values.length] = product.getId();
            if (jdbc.update("UPDATE products SET product_name=?,brand=?,description=?,image_url=?,price=?,base_price=?,gst_rate=?,hsn_code=?,hsn_verified=?,mrp=?,cost_price=?,operating_cost=?,platform_fee_percent=?,profit_margin_percent=?,rating=?,stock=?,discount=?,seller_email=?,category_id=? WHERE id=?", updateValues) == 0)
                throw new EmptyResultDataAccessException("Product not found", 1);
        }
        if (product.getMedia() == null || product.getMedia().isEmpty()) {
            if (product.getImageUrl() != null && !product.getImageUrl().isBlank()) product.setMedia(List.of(new EasyCart.Backend.entity.ProductMedia(product.getImageUrl(), "IMAGE")));
        }
        if (!product.getMedia().isEmpty()) product.setImageUrl(product.getMedia().get(0).getUrl());
        mediaRepository.replace(product.getId(), product.getMedia());
        return product;
    }

    private Object[] values(Product p, Object categoryId) {
        return new Object[]{p.getProductName(),p.getBrand(),p.getDescription(),p.getImageUrl(),p.getPrice(),p.getBasePrice(),
                p.getGstRate(),p.getHsnCode(),p.isHsnVerified(),p.getMrp(),p.getCostPrice(),p.getOperatingCost(),
                p.getPlatformFeePercent(),p.getProfitMarginPercent(),p.getRating(),p.getStock(),p.getDiscount(),p.getSellerEmail(),categoryId};
    }

    public List<Product> findAll() { return jdbc.query(SELECT + " ORDER BY p.id", this::map).stream().map(this::attachMedia).toList(); }
    public List<Product> saveAll(Iterable<Product> products) {
        java.util.ArrayList<Product> saved = new java.util.ArrayList<>();
        for (Product product : products) saved.add(save(product));
        return saved;
    }
    public Optional<Product> findById(Long id) { return jdbc.queryOne(SELECT + " WHERE p.id=?", this::map, id).map(this::attachMedia); }
    public List<Product> findBySellerEmailIgnoreCase(String email) { return jdbc.query(SELECT + " WHERE LOWER(p.seller_email)=LOWER(?) ORDER BY p.id", this::map, email).stream().map(this::attachMedia).toList(); }
    public void delete(Product product) { jdbc.update("DELETE FROM products WHERE id=?", product.getId()); }

    private Product attachMedia(Product product) { product.setMedia(mediaRepository.findByProductId(product.getId())); if (!product.getMedia().isEmpty()) product.setImageUrl(product.getMedia().get(0).getUrl()); return product; }

    private Product map(ResultSet row) throws SQLException {
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
        Double customerRating = JdbcRepositorySupport.nullableDouble(row,"customer_rating");
        p.setRating(customerRating == null ? JdbcRepositorySupport.nullableDouble(row,"rating") : customerRating);
        p.setReviewCount(JdbcRepositorySupport.nullableInt(row,"review_count"));
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

