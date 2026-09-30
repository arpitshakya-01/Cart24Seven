package EasyCart.Backend.controller;

import EasyCart.Backend.dto.ProductResponse;
import EasyCart.Backend.entity.Category;
import EasyCart.Backend.entity.Product;
import EasyCart.Backend.repository.CategoryRepository;
import EasyCart.Backend.repository.ProductRepository;
import EasyCart.Backend.repository.UserRepository;
import EasyCart.Backend.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.net.URI;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {
    private final ProductService productService;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public ProductController(ProductService productService, ProductRepository productRepository, CategoryRepository categoryRepository, UserRepository userRepository) {
        this.productService = productService;
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts().stream().filter(this::isApprovedListing).map(ProductResponse::new).toList());
    }

    @GetMapping("/admin/all")
    public ResponseEntity<List<ProductResponse>> getAllProductsForAdmin() {
        return ResponseEntity.ok(productService.getAllProducts().stream().map(ProductResponse::new).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        Product product = productService.getProductById(id);
        if (!isApprovedListing(product)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This product is not currently available.");
        return ResponseEntity.ok(new ProductResponse(product));
    }

    @GetMapping("/{id}/management")
    public ResponseEntity<Product> getProductForManagement(@PathVariable Long id, Authentication authentication) {
        Product product = productService.getProductById(id);
        requireOwnerOrAdmin(product, authentication);
        return ResponseEntity.ok(product);
    }

    @PostMapping
    public ResponseEntity<ProductResponse> addProduct(@RequestBody Product product, Authentication authentication) {
        applyPricing(product);
        product.setImageUrl(normalizeImageUrl(product.getImageUrl()));
        if (hasRole(authentication, "SELLER")) {
            requireSellerTaxProfile(authentication);
            product.setSellerEmail(authentication.getName());
            product.setHsnVerified(false);
        }
        product.setCategory(resolveCategory(product.getCategory()));
        Product saved = productService.addProduct(product);
        return ResponseEntity.status(HttpStatus.CREATED).body(new ProductResponse(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id, @RequestBody Product updated, Authentication authentication) {
        Product existing = productService.getProductById(id);
        requireOwnerOrAdmin(existing, authentication);
        applyPricing(updated);
        updated.setImageUrl(normalizeImageUrl(updated.getImageUrl()));
        if (!java.util.Objects.equals(existing.getHsnCode(), updated.getHsnCode())) existing.setHsnVerified(false);
        if (hasRole(authentication, "SELLER")) {
            requireSellerTaxProfile(authentication);
            updated.setSellerEmail(authentication.getName());
        }
        if (updated.getCategory() != null) updated.setCategory(resolveCategory(updated.getCategory()));
        Product saved = productService.updateProduct(id, updated);
        return ResponseEntity.ok(new ProductResponse(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProduct(@PathVariable Long id, Authentication authentication) {
        requireOwnerOrAdmin(productService.getProductById(id), authentication);
        productService.deleteProduct(id);
        return ResponseEntity.ok("Product deleted successfully");
    }

    @PatchMapping("/{id}/hsn-verification")
    public ProductResponse verifyHsn(@PathVariable Long id, @RequestBody java.util.Map<String, Boolean> body, Authentication auth) {
        if (!hasRole(auth, "ADMIN")) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only an admin can verify HSN codes.");
        Product product = productService.getProductById(id);
        boolean verified = Boolean.TRUE.equals(body.get("verified"));
        if (verified && (product.getHsnCode() == null || product.getHsnCode().isBlank()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Add an HSN code before verifying it.");
        product.setHsnVerified(verified);
        return new ProductResponse(productRepository.save(product));
    }

    private Category resolveCategory(Category requested) {
        if (requested == null) return null;
        if (requested.getId() != null) {
            return categoryRepository.findById(requested.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Category not found."));
        }
        String name = requested.getCategoryName();
        if (name == null || name.isBlank()) return null;
        return categoryRepository.findByCategoryNameIgnoreCase(name.trim()).orElseGet(() -> {
            Category category = new Category();
            category.setCategoryName(name.trim());
            return categoryRepository.save(category);
        });
    }

    private void requireOwnerOrAdmin(Product product, Authentication auth) {
        if (hasRole(auth, "ADMIN")) return;
        if (auth == null || !hasRole(auth, "SELLER") || !auth.getName().equalsIgnoreCase(product.getSellerEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own products.");
        }
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth != null && auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    private void applyPricing(Product product) {
        try {
            ProductPricing.apply(product);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    private boolean isApprovedListing(Product product) {
        if (product.getSellerEmail() == null || product.getSellerEmail().isBlank()) return true;
        return userRepository.findByEmailIgnoreCase(product.getSellerEmail())
                .map(user -> "VERIFIED".equalsIgnoreCase(user.getGstinStatus()) && product.isHsnVerified())
                .orElse(false);
    }

    private void requireSellerTaxProfile(Authentication auth) {
        var seller = userRepository.findByEmailIgnoreCase(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Seller account could not be found."));
        if (!"VERIFIED".equalsIgnoreCase(seller.getGstinStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Submit your GSTIN and business state, then wait for admin verification before creating taxable listings.");
    }

    private String normalizeImageUrl(String value) {
        if (value == null || value.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A product image URL is required.");
        String source = value.trim();
        if (source.startsWith("//")) source = "https:" + source;
        if (source.regionMatches(true, 0, "http://", 0, 7) || source.regionMatches(true, 0, "https://", 0, 8)) {
            try {
                URI uri = URI.create(source);
                if (uri.getHost() == null || uri.getHost().isBlank()) throw new IllegalArgumentException();
                return uri.toASCIIString();
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid direct HTTP or HTTPS image URL.");
            }
        }
        if (source.startsWith("/uploads/")) return source;
        if (source.startsWith("uploads/")) return "/" + source;
        if (!source.contains("/") && !source.contains("\\") && !source.contains(":")) return "/uploads/" + source;
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Use a direct HTTP/HTTPS image URL or an uploaded image.");
    }
}
