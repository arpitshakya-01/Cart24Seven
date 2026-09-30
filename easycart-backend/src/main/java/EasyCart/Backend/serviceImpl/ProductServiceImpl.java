package EasyCart.Backend.serviceImpl;

import EasyCart.Backend.entity.Product;
import EasyCart.Backend.exception.ProductNotFoundException;
import EasyCart.Backend.repository.ProductRepository;
import EasyCart.Backend.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository productRepository;

    // Add Product
    @Override
    public Product addProduct(Product product) {
        return productRepository.save(product);
    }

    // Get All Products
    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // Get Product By ID
    @Override
    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() ->
                        new ProductNotFoundException("Product with ID " + id + " not found"));
    }

    // Delete Product
    @Override
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ProductNotFoundException("Product with ID " + id + " not found"));

        productRepository.delete(product);
    }

    // Update Product
    @Override
    public Product updateProduct(Long id, Product updatedProduct) {

        Product product = productRepository.findById(id)
                .orElseThrow(() ->
                        new ProductNotFoundException("Product with ID " + id + " not found"));

        product.setProductName(updatedProduct.getProductName());
        product.setDescription(updatedProduct.getDescription());
        product.setBrand(updatedProduct.getBrand());
        product.setPrice(updatedProduct.getPrice());
        product.setMrp(updatedProduct.getMrp());
        product.setBasePrice(updatedProduct.getBasePrice());
        product.setGstRate(updatedProduct.getGstRate());
        product.setHsnCode(updatedProduct.getHsnCode());
        product.setCostPrice(updatedProduct.getCostPrice());
        product.setOperatingCost(updatedProduct.getOperatingCost());
        product.setPlatformFeePercent(updatedProduct.getPlatformFeePercent());
        product.setProfitMarginPercent(updatedProduct.getProfitMarginPercent());
        product.setStock(updatedProduct.getStock());
        product.setDiscount(updatedProduct.getDiscount());
        product.setRating(updatedProduct.getRating());
        product.setImageUrl(updatedProduct.getImageUrl());
        product.setCategory(updatedProduct.getCategory());

        return productRepository.save(product);
    }
}
