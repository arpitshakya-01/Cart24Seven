package EasyCart.Backend.service;

import EasyCart.Backend.entity.Category;
import java.util.List;

public interface CategoryService {

    // Add Category
    Category addCategory(Category category);

    // Get All Categories
    List<Category> getAllCategories();

    // Get Category By ID
    Category getCategoryById(Long id);

    // Update Category
    Category updateCategory(Long id, Category category);

    // Delete Category
    void deleteCategory(Long id);
}
