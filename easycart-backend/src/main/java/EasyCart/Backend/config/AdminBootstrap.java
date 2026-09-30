package EasyCart.Backend.config;

import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements CommandLineRunner {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    @Value("${app.bootstrap.admin-email:}") private String email;
    @Value("${app.bootstrap.admin-password:}") private String password;
    @Value("${app.bootstrap.admin-name:Administrator}") private String name;

    public AdminBootstrap(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (email == null || email.isBlank() || password == null || password.length() < 8) return;
        User admin = users.findByEmail(email.trim().toLowerCase()).orElseGet(User::new);
        admin.setName(name == null || name.isBlank() ? "Administrator" : name.trim());
        admin.setEmail(email.trim().toLowerCase());
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole("ADMIN");
        users.save(admin);
    }
}
