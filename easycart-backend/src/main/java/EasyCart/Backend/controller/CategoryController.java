package EasyCart.Backend.controller;

import EasyCart.Backend.dto.CategoryDTO;
import EasyCart.Backend.entity.Category;
import EasyCart.Backend.service.CategoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    @Autowired
    private CategoryService categoryService;

    // Add Category
    @PostMapping
    public Category addCategory(@Valid @RequestBody CategoryDTO categoryDTO) {

        Category category = new Category();
        category.setCategoryName(categoryDTO.getCategoryName());
        category.setDescription(categoryDTO.getDescription());

        return categoryService.addCategory(category);
    }

    // Get All Categories
    @GetMapping
    public List<Category> getAllCategories() {
        return categoryService.getAllCategories();
    }

    // Get Category By ID
    @GetMapping("/{id}")
    public Category getCategoryById(@PathVariable Long id) {
        return categoryService.getCategoryById(id);
    }

    // Update Category
    @PutMapping("/{id}")
    public Category updateCategory(@PathVariable Long id,
                                   @Valid @RequestBody CategoryDTO categoryDTO) {

        Category category = new Category();
        category.setCategoryName(categoryDTO.getCategoryName());
        category.setDescription(categoryDTO.getDescription());

        return categoryService.updateCategory(id, category);
    }

    // Delete Category
    @DeleteMapping("/{id}")
    public String deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return "Category Deleted Successfully!";
    }
}
