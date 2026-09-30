package EasyCart.Backend.service;

import EasyCart.Backend.entity.Product;
import java.util.List;

public interface ProductService {

    // Add Product
    Product addProduct(Product product);

    // Get All Products
    List<Product> getAllProducts();

    // Get Product By ID
    Product getProductById(Long id);

    // Delete Product
    void deleteProduct(Long id);

    // Update Product
    Product updateProduct(Long id, Product product);
}
