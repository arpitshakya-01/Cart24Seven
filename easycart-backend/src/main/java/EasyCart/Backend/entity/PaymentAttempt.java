package EasyCart.Backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_attempts", indexes = @Index(name = "idx_payment_attempt_buyer", columnList = "buyer_email"))
public class PaymentAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(name = "razorpay_order_id", nullable = false, unique = true)
    private String razorpayOrderId;
    @Column(name = "buyer_email", nullable = false)
    private String buyerEmail;
    @Column(nullable = false)
    private Long amountPaise;
    @Column(nullable = false, length = 3)
    private String currency = "INR";
    @Column(nullable = false, length = 20)
    private String status = "PENDING";
    @Lob @Column(nullable = false)
    private String orderSnapshot;
    private String paymentId;
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public String getRazorpayOrderId() { return razorpayOrderId; }
    public void setRazorpayOrderId(String value) { this.razorpayOrderId = value; }
    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String value) { this.buyerEmail = value; }
    public Long getAmountPaise() { return amountPaise; }
    public void setAmountPaise(Long value) { this.amountPaise = value; }
    public String getCurrency() { return currency; }
    public void setCurrency(String value) { this.currency = value; }
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status = value; }
    public String getOrderSnapshot() { return orderSnapshot; }
    public void setOrderSnapshot(String value) { this.orderSnapshot = value; }
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String value) { this.paymentId = value; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
