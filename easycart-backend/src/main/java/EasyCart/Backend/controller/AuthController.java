package EasyCart.Backend.controller;

import EasyCart.Backend.dto.AuthResponse;
import EasyCart.Backend.dto.LoginRequest;
import EasyCart.Backend.dto.RegisterRequest;
import EasyCart.Backend.service.AuthService;
import EasyCart.Backend.service.EmailVerificationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${APP_FRONTEND_ORIGIN:http://localhost:5173}")
public class AuthController {
    private final AuthService authService;
    private final EmailVerificationService emailVerification;

    public AuthController(AuthService authService, EmailVerificationService emailVerification) {
        this.authService = authService;
        this.emailVerification = emailVerification;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) { return authService.register(request); }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) { return authService.login(request); }

    @PostMapping("/verify-email")
    public java.util.Map<String, Boolean> verifyEmail(@RequestBody VerificationRequest request) {
        return java.util.Map.of("verified", emailVerification.verify(request.token()));
    }

    @PostMapping("/verification/resend")
    public java.util.Map<String, Boolean> resendVerification(@RequestBody ResendVerificationRequest request) {
        emailVerification.resend(request.email());
        return java.util.Map.of("accepted", true);
    }

    public record VerificationRequest(String token) {}
    public record ResendVerificationRequest(String email) {}
}
