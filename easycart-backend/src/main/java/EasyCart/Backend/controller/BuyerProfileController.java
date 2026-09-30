package EasyCart.Backend.controller;

import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/buyer/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class BuyerProfileController {
    private final UserRepository users;
    public BuyerProfileController(UserRepository users) { this.users = users; }

    @GetMapping
    public Map<String, Object> getProfile(Authentication auth) {
        User user = getUser(auth);
        return Map.of("name", value(user.getName()), "email", value(user.getEmail()), "phone", value(user.getPhone()),
                "addressLine", value(user.getAddressLine()), "city", value(user.getCity()), "state", value(user.getState()),
                "pincode", value(user.getPincode()), "paymentPreference", value(user.getPaymentPreference()));
    }

    @PutMapping
    public Map<String, Object> saveProfile(@RequestBody Map<String, String> data, Authentication auth) {
        User user = getUser(auth);
        if (data.containsKey("name")) user.setName(data.get("name"));
        if (data.containsKey("phone")) user.setPhone(data.get("phone"));
        if (data.containsKey("addressLine")) user.setAddressLine(data.get("addressLine"));
        if (data.containsKey("city")) user.setCity(data.get("city"));
        if (data.containsKey("state")) user.setState(data.get("state"));
        if (data.containsKey("pincode")) user.setPincode(data.get("pincode"));
        if (data.containsKey("paymentPreference")) {
            String method = data.get("paymentPreference");
            if (!"COD".equals(method) && !"ONLINE".equals(method)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose COD or ONLINE payment preference.");
            }
            user.setPaymentPreference(method);
        }
        users.save(user);
        return getProfile(auth);
    }

    private User getUser(Authentication auth) {
        return users.findByEmail(auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Account not found."));
    }
    private String value(String input) { return input == null ? "" : input; }
}
