package EasyCart.Backend.dto;

import jakarta.validation.constraints.NotBlank;

public class CategoryDTO {

    @NotBlank(message = "Category name cannot be empty")
    private String categoryName;

    @NotBlank(message = "Description cannot be empty")
    private String description;

    public CategoryDTO() {
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}
