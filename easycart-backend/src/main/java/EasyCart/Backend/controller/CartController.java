package EasyCart.Backend.controller;

import EasyCart.Backend.entity.Cart;
import EasyCart.Backend.entity.CartItem;
import EasyCart.Backend.entity.Product;
import EasyCart.Backend.repository.CartItemRepository;
import EasyCart.Backend.repository.CartRepository;
import EasyCart.Backend.repository.ProductRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "${APP_FRONTEND_ORIGIN:http://localhost:5173}")
public class CartController {
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

    public CartController(CartRepository cartRepository, CartItemRepository cartItemRepository, ProductRepository productRepository) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
    }

    @GetMapping
    @Transactional
    public CartResponse getCart(Authentication auth) { return response(getOrCreateCart(auth.getName())); }

    @PostMapping("/items")
    @Transactional
    public CartResponse addItem(@Valid @RequestBody ItemRequest request, Authentication auth) {
        Cart cart = getOrCreateCart(auth.getName());
        Product product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found."));
        if (product.getSellerEmail() != null && (!product.isHsnVerified() || product.getHsnCode() == null || product.getHsnCode().isBlank()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This seller listing is awaiting GST and HSN compliance review.");
        CartItem item = cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId()).orElse(null);
        int quantity = (item == null ? 0 : item.getQuantity()) + request.quantity();
        ensureStock(product, quantity);
        if (item == null) cartItemRepository.save(new CartItem(cart, product, quantity));
        else { item.setQuantity(quantity); cartItemRepository.save(item); }
        return response(cart);
    }

    @PutMapping("/items/{productId}")
    @Transactional
    public CartResponse updateItem(@PathVariable Long productId, @Valid @RequestBody QuantityRequest request, Authentication auth) {
        Cart cart = getOrCreateCart(auth.getName());
        CartItem item = cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Item is not in this cart."));
        ensureStock(item.getProduct(), request.quantity());
        item.setQuantity(request.quantity());
        cartItemRepository.save(item);
        return response(cart);
    }

    @DeleteMapping("/items/{productId}")
    @Transactional
    public CartResponse removeItem(@PathVariable Long productId, Authentication auth) {
        Cart cart = getOrCreateCart(auth.getName());
        CartItem item = cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), productId).orElse(null);
        if (item != null) {
            cartItemRepository.delete(item);
        }
        return response(cart);
    }

    @DeleteMapping
    @Transactional
    public CartResponse clearCart(Authentication auth) {
        Cart cart = getOrCreateCart(auth.getName());
        cartItemRepository.deleteByCart_Id(cart.getId());
        return response(cart);
    }

    private Cart getOrCreateCart(String email) {
        return cartRepository.findByBuyerEmailIgnoreCase(email).orElseGet(() -> cartRepository.save(new Cart(email)));
    }

    private void ensureStock(Product product, int quantity) {
        int stock = product.getStock() == null ? 0 : product.getStock();
        if (quantity > stock) throw new ResponseStatusException(HttpStatus.CONFLICT, "Only " + stock + " item(s) are currently in stock.");
    }

    private CartResponse response(Cart cart) {
        List<CartLine> lines = cartItemRepository.findByCart_Id(cart.getId()).stream().map(item -> {
            Product product = item.getProduct();
            return new CartLine(product.getId(), product.getProductName(), product.getBrand(), product.getDescription(),
                    product.getImageUrl(), product.getPrice(), product.getMrp(), product.getRating(), product.getStock(), product.getDiscount(),
                    product.getCategory() == null ? null : product.getCategory().getCategoryName(), item.getQuantity(),
                    product.getGstRate() == null ? 18.0 : product.getGstRate(), product.getHsnCode());
        }).toList();
        return new CartResponse(cart.getId(), lines);
    }

    public record ItemRequest(@jakarta.validation.constraints.NotNull Long productId, @Min(1) int quantity) {}
    public record QuantityRequest(@Min(1) int quantity) {}
    public record CartResponse(Long id, List<CartLine> items) {}
    public record CartLine(Long productId, String productName, String brand, String description, String imageUrl,
                           Double price, Double mrp, Double rating, Integer stock, Integer discount, String category, Integer quantity,
                           Double gstRate, String hsnCode) {}
}




