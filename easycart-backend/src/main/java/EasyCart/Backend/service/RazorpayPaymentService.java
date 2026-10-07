package EasyCart.Backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

@Service
public class RazorpayPaymentService {
    @Value("${app.payment.razorpay.key-id}") private String keyId;
    @Value("${app.payment.razorpay.key-secret}") private String keySecret;

    private final ObjectMapper mapper;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(java.time.Duration.ofSeconds(10)).build();

    public RazorpayPaymentService(ObjectMapper mapper) { this.mapper = mapper; }

    public boolean isConfigured() { return !keyId.isBlank() && !keySecret.isBlank(); }
    public String getKeyId() { return keyId; }

    public RazorpayOrder createOrder(long amountPaise) {
        requireConfigured();
        try {
            String receipt = "cart24-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
            String body = mapper.writeValueAsString(Map.of("amount", amountPaise, "currency", "INR", "receipt", receipt));
            String credentials = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.razorpay.com/v1/orders"))
                    .timeout(java.time.Duration.ofSeconds(20))
                    .header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body)).build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = mapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || json.path("id").asText().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay could not start the payment. Please retry.");
            }
            return new RazorpayOrder(json.path("id").asText(), json.path("amount").asLong(), json.path("currency").asText("INR"));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Payment service is temporarily unavailable. Please retry.");
        }
    }

    public boolean verifySignature(String orderId, String paymentId, String signature) {
        requireConfigured();
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] expected = HexFormat.of().parseHex(HexFormat.of().formatHex(mac.doFinal((orderId + "|" + paymentId).getBytes(StandardCharsets.UTF_8))));
            byte[] supplied = HexFormat.of().parseHex(signature);
            return MessageDigest.isEqual(expected, supplied);
        } catch (Exception ex) {
            return false;
        }
    }

    public Refund refundPayment(String paymentId, long amountPaise) {
        requireConfigured();
        if (paymentId == null || paymentId.isBlank() || amountPaise < 1) throw new ResponseStatusException(HttpStatus.CONFLICT, "This payment cannot be refunded automatically.");
        try {
            String body = mapper.writeValueAsString(Map.of("amount", amountPaise));
            String credentials = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.razorpay.com/v1/payments/" + paymentId + "/refund"))
                    .timeout(java.time.Duration.ofSeconds(20)).header("Authorization", "Basic " + credentials)
                    .header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body)).build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            JsonNode json = mapper.readTree(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300 || json.path("id").asText().isBlank())
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Razorpay could not accept the refund. The order was not cancelled.");
            return new Refund(json.path("id").asText(), json.path("status").asText("pending"));
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Refund service is temporarily unavailable. The order was not cancelled.");
        }
    }

    public boolean isCapturedPayment(String paymentId, String orderId, long amountPaise) {
        requireConfigured();
        try {
            String credentials = Base64.getEncoder().encodeToString((keyId + ":" + keySecret).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.razorpay.com/v1/payments/" + paymentId))
                    .timeout(java.time.Duration.ofSeconds(20))
                    .header("Authorization", "Basic " + credentials)
                    .GET().build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) return false;
            JsonNode payment = mapper.readTree(response.body());
            return "captured".equalsIgnoreCase(payment.path("status").asText())
                    && orderId.equals(payment.path("order_id").asText())
                    && amountPaise == payment.path("amount").asLong()
                    && "INR".equalsIgnoreCase(payment.path("currency").asText());
        } catch (Exception ex) {
            return false;
        }
    }

    private void requireConfigured() {
        if (!isConfigured()) throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                "Online payment is not configured yet. Choose Cash on Delivery or configure Razorpay keys.");
    }

    public record RazorpayOrder(String id, long amount, String currency) {}
    public record Refund(String id, String status) {}
}
