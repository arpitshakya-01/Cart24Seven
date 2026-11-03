package EasyCart.Backend.config;

import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.UserRepository;
import EasyCart.Backend.service.EmailVerificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements CommandLineRunner {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerification;
    @Value("${app.bootstrap.admin-email:}") private String email;
    @Value("${app.bootstrap.admin-password:}") private String password;
    @Value("${app.bootstrap.admin-name:Administrator}") private String name;

    public AdminBootstrap(UserRepository users, PasswordEncoder passwordEncoder, EmailVerificationService emailVerification) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.emailVerification = emailVerification;
    }

    @Override
    public void run(String... args) {
        if (email == null || email.isBlank() || password == null || password.length() < 8) return;
        User admin = users.findByEmail(email.trim().toLowerCase()).orElseGet(() -> {
            User created = User.forRole(EasyCart.Backend.entity.Role.ADMIN);
            created.setEmailVerified(false);
            return created;
        });
        admin.setName(name == null || name.isBlank() ? "Administrator" : name.trim());
        admin.setEmail(email.trim().toLowerCase());
        admin.setPassword(passwordEncoder.encode(password));
        admin.setRole("ADMIN");
        User saved = users.save(admin);
        if (!saved.isEmailVerified() && emailVerification.isConfigured()) {
            try { emailVerification.send(saved); }
            catch (RuntimeException ex) {
                System.getLogger(AdminBootstrap.class.getName()).log(System.Logger.Level.WARNING,
                        "Could not send the initial admin email verification link; it can be resent after startup.");
            }
        }
    }
}
