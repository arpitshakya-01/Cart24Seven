package EasyCart.Backend.controller;

import EasyCart.Backend.dto.AuthResponse;
import EasyCart.Backend.dto.LoginRequest;
import EasyCart.Backend.dto.RegisterRequest;
import EasyCart.Backend.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) { this.authService = authService; }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) { return authService.register(request); }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) { return authService.login(request); }
}
