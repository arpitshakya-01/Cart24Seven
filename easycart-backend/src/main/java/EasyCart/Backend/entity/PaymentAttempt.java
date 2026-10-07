package EasyCart.Backend.entity;

import java.time.LocalDateTime;
public class PaymentAttempt {
    private Long id;
    private String razorpayOrderId;
    private String buyerEmail;
    private Long amountPaise;
    private String currency = "INR";
    private String status = "PENDING";
    private String orderSnapshot;
    private String paymentId;
    private LocalDateTime createdAt = LocalDateTime.now();

    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
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
    public void setCreatedAt(LocalDateTime value) { this.createdAt = value; }
}


