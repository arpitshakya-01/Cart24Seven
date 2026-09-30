package EasyCart.Backend.serviceImpl;

import EasyCart.Backend.entity.Category;
import EasyCart.Backend.exception.CategoryNotFoundException;
import EasyCart.Backend.repository.CategoryRepository;
import EasyCart.Backend.service.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryServiceImpl implements CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    // Add Category
    @Override
    public Category addCategory(Category category) {
        return categoryRepository.save(category);
    }

    // Get All Categories
    @Override
    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    // Get Category By ID
    @Override
    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() ->
                        new CategoryNotFoundException("Category with ID " + id + " not found"));
    }

    // Update Category
    @Override
    public Category updateCategory(Long id, Category updatedCategory) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new CategoryNotFoundException("Category with ID " + id + " not found"));

        category.setCategoryName(updatedCategory.getCategoryName());
        category.setDescription(updatedCategory.getDescription());

        return categoryRepository.save(category);
    }

    // Delete Category
    @Override
    public void deleteCategory(Long id) {

        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new CategoryNotFoundException("Category with ID " + id + " not found"));

        categoryRepository.delete(category);
    }
}
