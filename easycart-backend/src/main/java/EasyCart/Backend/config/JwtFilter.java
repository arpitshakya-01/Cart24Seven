package EasyCart.Backend.config;

import EasyCart.Backend.entity.Role;
import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ") && SecurityContextHolder.getContext().getAuthentication() == null) {
            try {
                String token = header.substring(7).trim();
                String email = jwtService.extractEmail(token);
                User user = userRepository.findByEmailIgnoreCase(email).orElse(null);
                if (user != null && jwtService.isTokenValid(token, user.getEmail())) {
                    Role role = Role.from(user.getRole());
                    var authentication = new UsernamePasswordAuthenticationToken(
                            user.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_" + role.name())));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }
            } catch (RuntimeException ignored) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
