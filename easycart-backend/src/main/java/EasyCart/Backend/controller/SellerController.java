package EasyCart.Backend.controller;

import EasyCart.Backend.entity.Product;
import EasyCart.Backend.repository.ProductRepository;
import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/seller")
@CrossOrigin(origins = "http://localhost:5173")
public class SellerController {
    private final ProductRepository productRepository;
    private final UserRepository users;
    public SellerController(ProductRepository productRepository, UserRepository users) { this.productRepository = productRepository; this.users = users; }

    @GetMapping("/products")
    public List<Product> myProducts(org.springframework.security.core.Authentication auth) {
        return productRepository.findBySellerEmailIgnoreCase(auth.getName());
    }

    @GetMapping("/compliance")
    public Map<String, String> compliance(Authentication auth) {
        User user = getUser(auth);
        return Map.of("gstin", safe(user.getGstin()), "gstinStatus", safe(user.getGstinStatus()), "businessState", safe(user.getState()));
    }

    @PutMapping("/compliance")
    public Map<String, String> updateCompliance(@RequestBody Map<String, String> data, Authentication auth) {
        User user = getUser(auth);
        String gstin = data.getOrDefault("gstin", "").trim().toUpperCase();
        String state = data.getOrDefault("businessState", "").trim();
        if (!gstin.isBlank() && !gstin.matches("[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a GSTIN in the correct 15-character format.");
        user.setGstin(gstin.isBlank() ? null : gstin);
        user.setState(state);
        user.setGstinStatus(gstin.isBlank() ? "NOT_SUBMITTED" : "PENDING");
        users.save(user);
        return compliance(auth);
    }

    private User getUser(Authentication auth) {
        return users.findByEmailIgnoreCase(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Seller account not found."));
    }
    private String safe(String value) { return value == null ? "" : value; }
}
