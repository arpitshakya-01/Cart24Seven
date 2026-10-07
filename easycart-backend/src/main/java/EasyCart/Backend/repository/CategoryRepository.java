package EasyCart.Backend.repository;

import EasyCart.Backend.entity.Category;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class CategoryRepository {
    private final JdbcRepositorySupport jdbc;
    public CategoryRepository(JdbcRepositorySupport jdbc) { this.jdbc = jdbc; }

    public Category save(Category category) {
        if (category.getId() == null) {
            category.setId(jdbc.insert("INSERT INTO categories (category_name,description) VALUES (?,?)",
                    category.getCategoryName(),category.getDescription()));
        } else if (jdbc.update("UPDATE categories SET category_name=?,description=? WHERE id=?",
                category.getCategoryName(),category.getDescription(),category.getId()) == 0) {
            throw new EmptyResultDataAccessException("Category not found", 1);
        }
        return category;
    }

    public List<Category> findAll() { return jdbc.query("SELECT id,category_name,description FROM categories ORDER BY id", this::map); }
    public Optional<Category> findById(Long id) { return jdbc.queryOne("SELECT id,category_name,description FROM categories WHERE id=?", this::map, id); }
    public Optional<Category> findByCategoryNameIgnoreCase(String name) {
        return jdbc.queryOne("SELECT id,category_name,description FROM categories WHERE LOWER(category_name)=LOWER(?) LIMIT 1", this::map, name);
    }
    @Transactional
    public void delete(Category category) {
        jdbc.update("UPDATE products SET category_id=NULL WHERE category_id=?", category.getId());
        if (jdbc.update("DELETE FROM categories WHERE id=?", category.getId()) == 0)
            throw new EmptyResultDataAccessException("Category not found", 1);
    }
    private Category map(ResultSet r) throws SQLException {
        Category c = new Category();
        c.setId(r.getLong("id")); c.setCategoryName(r.getString("category_name")); c.setDescription(r.getString("description"));
        return c;
    }
}


