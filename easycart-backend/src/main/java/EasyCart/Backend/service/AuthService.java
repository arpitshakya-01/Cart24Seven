package EasyCart.Backend.service;

import EasyCart.Backend.config.JwtService;
import EasyCart.Backend.dto.AuthResponse;
import EasyCart.Backend.dto.LoginRequest;
import EasyCart.Backend.dto.RegisterRequest;
import EasyCart.Backend.entity.Role;
import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, AuthenticationManager authenticationManager, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already registered.");
        }
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.BUYER.name());
        try {
            User saved = userRepository.save(user);
            return new AuthResponse(null, saved.getName(), saved.getEmail(), Role.BUYER.name());
        } catch (org.springframework.dao.DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "This email is already registered.");
        }
    }

    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password."));
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.getPassword()));
        } catch (org.springframework.security.core.AuthenticationException exception) {
            if (!upgradeLegacyPassword(user, request.getPassword())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password.");
            }
        }
        if (user.getRole() == null || user.getRole().isBlank()) user.setRole(Role.BUYER.name());
        return responseFor(user);
    }
    private boolean upgradeLegacyPassword(User user, String submittedPassword) {
        String storedPassword = user.getPassword();
        if (storedPassword == null || storedPassword.startsWith("$2") || submittedPassword == null) return false;
        boolean matches = java.security.MessageDigest.isEqual(
                storedPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                submittedPassword.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        if (matches) {
            user.setPassword(passwordEncoder.encode(submittedPassword));
            userRepository.save(user);
        }
        return matches;
    }
    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required.");
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private AuthResponse responseFor(User user) {
        String role = Role.from(user.getRole()).name();
        return new AuthResponse(jwtService.generateToken(user.getEmail(), role), user.getName(), user.getEmail(), role);
    }
}





