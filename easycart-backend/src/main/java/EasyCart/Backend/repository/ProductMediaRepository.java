package EasyCart.Backend.repository;

import EasyCart.Backend.entity.ProductMedia;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

@Repository
public class ProductMediaRepository {
    private final JdbcRepositorySupport jdbc;
    public ProductMediaRepository(JdbcRepositorySupport jdbc) { this.jdbc=jdbc; }
    public List<ProductMedia> findByProductId(Long id) { return jdbc.query("SELECT media_url,media_type FROM product_media WHERE product_id=? ORDER BY sort_order,id", r -> new ProductMedia(r.getString("media_url"),r.getString("media_type")), id); }
    public Map<Long, List<ProductMedia>> findByProductIds(List<Long> ids) {
        Map<Long, List<ProductMedia>> grouped = new HashMap<>();
        if (ids == null || ids.isEmpty()) return grouped;
        for (int start = 0; start < ids.size(); start += 500) {
            List<Long> batch = ids.subList(start, Math.min(start + 500, ids.size()));
            String placeholders = String.join(",", java.util.Collections.nCopies(batch.size(), "?"));
            String sql = "SELECT product_id,media_url,media_type FROM product_media WHERE product_id IN (" + placeholders + ") ORDER BY product_id,sort_order,id";
            List<MediaRow> rows = jdbc.query(sql, r -> new MediaRow(r.getLong("product_id"),
                    new ProductMedia(r.getString("media_url"), r.getString("media_type"))), batch.toArray());
            for (MediaRow row : rows) grouped.computeIfAbsent(row.productId(), ignored -> new ArrayList<>()).add(row.media());
        }
        return grouped;
    }
    public void replace(Long id, List<ProductMedia> media) {
        jdbc.update("DELETE FROM product_media WHERE product_id=?",id);
        if (media == null || media.isEmpty()) return;
        List<Object[]> rows = new ArrayList<>();
        for (int i = 0; i < media.size(); i++) {
            ProductMedia item = media.get(i);
            rows.add(new Object[]{id, item.getUrl(), item.getType(), i});
        }
        jdbc.batchUpdate("INSERT INTO product_media(product_id,media_url,media_type,sort_order) VALUES(?,?,?,?)", rows);
    }

    private record MediaRow(Long productId, ProductMedia media) {}
}
