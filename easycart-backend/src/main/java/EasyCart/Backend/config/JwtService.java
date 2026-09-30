package EasyCart.Backend.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Service
public class JwtService {
    private final Key signingKey;
    private static final long TOKEN_LIFETIME_MILLIS = 1000L * 60 * 60 * 24;

    public JwtService(@Value("${app.jwt.secret}") String secret) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < 32) throw new IllegalArgumentException("app.jwt.secret must contain at least 32 UTF-8 bytes.");
        this.signingKey = Keys.hmacShaKeyFor(bytes);
    }

    public String generateToken(String email) { return generateToken(email, null); }

    public String generateToken(String email, String role) {
        long now = System.currentTimeMillis();
        var builder = Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + TOKEN_LIFETIME_MILLIS));
        if (role != null && !role.isBlank()) builder.claim("role", role);
        return builder.signWith(signingKey, SignatureAlgorithm.HS256).compact();
    }

    public String extractEmail(String token) { return parseClaims(token).getSubject(); }
    public String extractRole(String token) { return parseClaims(token).get("role", String.class); }

    public boolean isTokenValid(String token, String email) {
        Claims claims = parseClaims(token);
        return claims.getSubject().equalsIgnoreCase(email) && claims.getExpiration().after(new Date());
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(signingKey).build().parseClaimsJws(token).getBody();
    }
}
