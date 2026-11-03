package EasyCart.Backend.service;

import EasyCart.Backend.entity.User;
import EasyCart.Backend.repository.JdbcRepositorySupport;
import EasyCart.Backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Optional;

@Service
public class EmailVerificationService {
    private final JdbcRepositorySupport jdbc;
    private final UserRepository users;
    private final SendGridEmailService mailer;
    private final SecureRandom random = new SecureRandom();
    @Value("${app.frontend.url:http://localhost:5173}") private String frontendUrl;

    public EmailVerificationService(JdbcRepositorySupport jdbc, UserRepository users, SendGridEmailService mailer) {
        this.jdbc = jdbc;
        this.users = users;
        this.mailer = mailer;
    }

    public void requireConfigured() {
        if (!mailer.isConfigured()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Email verification is not configured. Add the SendGrid settings and try again.");
    }

    public boolean isConfigured() { return mailer.isConfigured(); }

    public void send(User user) {
        if (user == null || user.isEmailVerified()) return;
        requireConfigured();
        LocalDateTime now = LocalDateTime.now();
        Optional<LocalDateTime> lastSent = jdbc.queryOne(
                "SELECT created_at FROM email_verification_tokens WHERE user_id=?", row -> {
                    var timestamp = row.getTimestamp("created_at");
                    return timestamp == null ? null : timestamp.toLocalDateTime();
                }, user.getId());
        if (lastSent.isPresent() && lastSent.get().isAfter(now.minusMinutes(1)))
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS,
                    "A verification email was sent recently. Please wait a minute before requesting another.");

        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        String tokenHash = hash(token);
        LocalDateTime expires = now.plusHours(24);
        jdbc.update("INSERT INTO email_verification_tokens(user_id,token_hash,expires_at,created_at) VALUES(?,?,?,?) " +
                        "ON DUPLICATE KEY UPDATE token_hash=VALUES(token_hash),expires_at=VALUES(expires_at),created_at=VALUES(created_at)",
                user.getId(), tokenHash, expires, now);

        String link = frontendUrl.replaceAll("/+$", "") + "/verify-email?token=" + token;
        String safeName = escapeHtml(user.getName() == null ? "there" : user.getName());
        mailer.send(user.getEmail(), "Verify your Cart24Seven email",
                "Hi " + user.getName() + ",\n\nVerify your email within 24 hours: " + link + "\n\nIf you did not create this account, ignore this email.",
                "<p>Hi " + safeName + ",</p><p>Verify your Cart24Seven email within 24 hours.</p>" +
                        "<p><a href=\"" + link + "\">Verify email</a></p>" +
                        "<p>If you did not create this account, you can ignore this email.</p>");
    }

    public void resend(String email) {
        String normalized = email == null ? "" : email.trim();
        users.findByEmailIgnoreCase(normalized).filter(user -> !user.isEmailVerified()).ifPresent(this::send);
    }

    public boolean verify(String token) {
        if (token == null || token.isBlank() || token.length() > 128) return false;
        String tokenHash = hash(token);
        Optional<Long> userId = jdbc.queryOne(
                "SELECT user_id FROM email_verification_tokens WHERE token_hash=? AND expires_at>?",
                row -> row.getLong("user_id"), tokenHash, LocalDateTime.now());
        if (userId.isEmpty()) return false;
        User user = users.findById(userId.get()).orElse(null);
        if (user == null) return false;
        user.setEmailVerified(true);
        users.save(user);
        jdbc.update("DELETE FROM email_verification_tokens WHERE user_id=?", userId.get());
        return true;
    }

    private String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not protect verification token.", ex);
        }
    }

    private String escapeHtml(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }
}
