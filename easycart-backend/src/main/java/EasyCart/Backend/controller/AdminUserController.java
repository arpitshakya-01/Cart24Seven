package EasyCart.Backend.controller;

import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminUserController {
    private final UserRepository users;
    private final PasswordEncoder encoder;
    public AdminUserController(UserRepository users, PasswordEncoder encoder) { this.users=users; this.encoder=encoder; }

    @GetMapping
    public List<Map<String,Object>> listUsers() { return users.findAll().stream().map(this::summary).toList(); }

    @PostMapping
    public Map<String,Object> createUser(@RequestBody Map<String,String> body) {
        String name=body.get("name"), email=body.get("email"), password=body.get("password");
        if(name==null||name.isBlank()||email==null||email.isBlank()||password==null||password.length()<8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Name, email, and a password of at least 8 characters are required.");
        if(users.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Email already exists.");
        User user=new User(); user.setName(name.trim()); user.setEmail(email.trim().toLowerCase(Locale.ROOT));
        user.setPassword(encoder.encode(password)); user.setRole(role(body.get("role")));
        return summary(users.save(user));
    }

    @PutMapping("/{id}")
    public Map<String,Object> updateUser(@PathVariable Long id,@RequestBody Map<String,String> body) {
        User user=users.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"User not found"));
        if(body.containsKey("name")) {
            if(body.get("name")==null||body.get("name").isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Name cannot be empty.");
            user.setName(body.get("name").trim());
        }
        if(body.containsKey("email")) {
            if(body.get("email")==null||body.get("email").isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Email cannot be empty.");
            String email=body.get("email").trim().toLowerCase(Locale.ROOT);
            if(!email.equalsIgnoreCase(user.getEmail())&&users.existsByEmail(email)) throw new ResponseStatusException(HttpStatus.CONFLICT,"Email already exists.");
            user.setEmail(email);
        }
        if(body.containsKey("role")) user.setRole(role(body.get("role")));
        if(body.containsKey("gstinStatus")) {
            String status = body.get("gstinStatus");
            if(!List.of("NOT_SUBMITTED", "PENDING", "VERIFIED", "REJECTED").contains(status))
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"GSTIN status must be NOT_SUBMITTED, PENDING, VERIFIED, or REJECTED.");
            if("VERIFIED".equals(status) && (user.getGstin() == null || user.getGstin().isBlank() || user.getState() == null || user.getState().isBlank()))
                throw new ResponseStatusException(HttpStatus.CONFLICT,"The seller must submit a GSTIN and business state before verification.");
            user.setGstinStatus(status);
        }
        if(body.containsKey("password")&&body.get("password")!=null&&!body.get("password").isBlank()) {
            if(body.get("password").length()<8) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Password must be at least 8 characters.");
            user.setPassword(encoder.encode(body.get("password")));
        }
        return summary(users.save(user));
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id,Authentication auth) {
        User user=users.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"User not found"));
        if(user.getEmail().equalsIgnoreCase(auth.getName())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"You cannot delete your own admin account.");
        users.delete(user);
    }

    private String role(String role) {
        String value=role==null?"":role.trim().toUpperCase(Locale.ROOT);
        if(!List.of("ADMIN","SELLER","BUYER","USER").contains(value)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Role must be ADMIN, SELLER, or BUYER.");
        return value.equals("USER")?"BUYER":value;
    }
    private Map<String,Object> summary(User user) {
        return Map.of("id",user.getId(),"name",user.getName(),"email",user.getEmail(),"role",user.getRole()==null?"BUYER":user.getRole(),
                "gstin",user.getGstin()==null?"":user.getGstin(),"gstinStatus",user.getGstinStatus()==null?"NOT_SUBMITTED":user.getGstinStatus(),
                "state",user.getState()==null?"":user.getState());
    }
}
