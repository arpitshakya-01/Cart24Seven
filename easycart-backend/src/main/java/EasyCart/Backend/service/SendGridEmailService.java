package EasyCart.Backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Service
public class SendGridEmailService {
    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    @Value("${app.email.sendgrid.api-key:}") private String apiKey;
    @Value("${app.email.sendgrid.from:}") private String from;

    public SendGridEmailService(ObjectMapper mapper) { this.mapper = mapper; }

    public boolean isConfigured() { return apiKey != null && !apiKey.isBlank() && from != null && !from.isBlank(); }

    public void send(String recipient, String subject, String text, String html) {
        if (!isConfigured()) throw new IllegalStateException("Email verification is not configured.");
        try {
            String body = mapper.writeValueAsString(Map.of(
                    "personalizations", List.of(Map.of("to", List.of(Map.of("email", recipient)))),
                    "from", Map.of("email", from, "name", "Cart24Seven"),
                    "subject", subject,
                    "content", List.of(Map.of("type", "text/plain", "value", text),
                            Map.of("type", "text/html", "value", html))));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.sendgrid.com/v3/mail/send"))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300)
                throw new IllegalStateException("Email delivery provider rejected the verification email (HTTP " + response.statusCode() + ").");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Email delivery was interrupted.", ex);
        } catch (Exception ex) {
            if (ex instanceof IllegalStateException state) throw state;
            throw new IllegalStateException("Could not deliver the verification email.", ex);
        }
    }
}
