package EasyCart.Backend.config;

import EasyCart.Backend.entity.Role;
import EasyCart.Backend.repository.UserRepository;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {
    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public UserDetailsService userDetailsService(UserRepository users) {
        return email -> users.findByEmailIgnoreCase(email)
                .map(user -> User.withUsername(user.getEmail())
                        .password(user.getPassword())
                        .authorities("ROLE_" + Role.from(user.getRole()).name())
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password."));
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtFilter jwtFilter, AuthenticationProvider authenticationProvider) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> {})
            .authenticationProvider(authenticationProvider)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, exception) -> {
                    response.setStatus(401);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"message\":\"Authentication is required or your session has expired.\"}");
                })
                .accessDeniedHandler((request, response, exception) -> {
                    response.setStatus(403);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.getWriter().write("{\"message\":\"You do not have permission to access this resource.\"}");
                }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/register", "/uploads/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/products/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.GET, "/api/products", "/api/products/**", "/api/categories", "/api/categories/**").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/seller/**").hasRole("SELLER")
                .requestMatchers("/api/buyer/**", "/api/cart", "/api/cart/**").hasRole("BUYER")
                .requestMatchers("/api/orders/place", "/api/orders/my-orders", "/api/orders/payment/**").hasRole("BUYER")
                .requestMatchers("/api/orders/seller/**").hasRole("SELLER")
                .requestMatchers("/api/orders/admin/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/products/**").hasAnyRole("ADMIN", "SELLER")
                .requestMatchers(HttpMethod.PUT, "/api/products/**").hasAnyRole("ADMIN", "SELLER")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasAnyRole("ADMIN", "SELLER")
                .requestMatchers(HttpMethod.POST, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/categories/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/categories/**").hasRole("ADMIN")
                .anyRequest().authenticated())
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
