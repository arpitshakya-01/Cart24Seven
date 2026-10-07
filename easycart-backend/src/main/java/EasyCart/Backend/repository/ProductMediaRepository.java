package EasyCart.Backend.repository;

import EasyCart.Backend.entity.ProductMedia;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public class ProductMediaRepository {
    private final JdbcRepositorySupport jdbc;
    public ProductMediaRepository(JdbcRepositorySupport jdbc) { this.jdbc=jdbc; }
    public List<ProductMedia> findByProductId(Long id) { return jdbc.query("SELECT media_url,media_type FROM product_media WHERE product_id=? ORDER BY sort_order,id", r -> new ProductMedia(r.getString("media_url"),r.getString("media_type")), id); }
    public void replace(Long id, List<ProductMedia> media) {
        jdbc.update("DELETE FROM product_media WHERE product_id=?",id);
        if (media != null) for (int i=0;i<media.size();i++) { ProductMedia item=media.get(i); jdbc.update("INSERT INTO product_media(product_id,media_url,media_type,sort_order) VALUES(?,?,?,?)",id,item.getUrl(),item.getType(),i); }
    }
}
