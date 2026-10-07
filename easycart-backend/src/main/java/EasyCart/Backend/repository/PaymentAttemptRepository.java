package EasyCart.Backend.repository;

import EasyCart.Backend.entity.PaymentAttempt;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.Optional;

@Repository
public class PaymentAttemptRepository {
    private static final String COLUMNS = "id,razorpay_order_id,buyer_email,amount_paise,currency,status,order_snapshot,payment_id,created_at";
    private final JdbcRepositorySupport jdbc;

    public PaymentAttemptRepository(JdbcRepositorySupport jdbc) { this.jdbc = jdbc; }

    public PaymentAttempt save(PaymentAttempt attempt) {
        if (attempt.getId() == null) {
            attempt.setId(jdbc.insert("INSERT INTO payment_attempts (razorpay_order_id,buyer_email,amount_paise,currency,status,order_snapshot,payment_id,created_at) VALUES (?,?,?,?,?,?,?,?)",
                    attempt.getRazorpayOrderId(),attempt.getBuyerEmail(),attempt.getAmountPaise(),attempt.getCurrency(),
                    attempt.getStatus(),attempt.getOrderSnapshot(),attempt.getPaymentId(),attempt.getCreatedAt()));
        } else if (jdbc.update("UPDATE payment_attempts SET razorpay_order_id=?,buyer_email=?,amount_paise=?,currency=?,status=?,order_snapshot=?,payment_id=?,created_at=? WHERE id=?",
                attempt.getRazorpayOrderId(),attempt.getBuyerEmail(),attempt.getAmountPaise(),attempt.getCurrency(),
                attempt.getStatus(),attempt.getOrderSnapshot(),attempt.getPaymentId(),attempt.getCreatedAt(),attempt.getId()) == 0) {
            throw new EmptyResultDataAccessException("Payment attempt not found", 1);
        }
        return attempt;
    }

    public Optional<PaymentAttempt> findByRazorpayOrderId(String id) {
        return jdbc.queryOne("SELECT " + COLUMNS + " FROM payment_attempts WHERE razorpay_order_id=? LIMIT 1", this::map, id);
    }
    public Optional<PaymentAttempt> findById(Long id) {
        return jdbc.queryOne("SELECT " + COLUMNS + " FROM payment_attempts WHERE id=?", this::map, id);
    }
    private PaymentAttempt map(ResultSet r) throws SQLException {
        PaymentAttempt a = new PaymentAttempt();
        a.setId(r.getLong("id")); a.setRazorpayOrderId(r.getString("razorpay_order_id"));
        a.setBuyerEmail(r.getString("buyer_email")); a.setAmountPaise(r.getLong("amount_paise"));
        a.setCurrency(r.getString("currency")); a.setStatus(r.getString("status"));
        a.setOrderSnapshot(r.getString("order_snapshot")); a.setPaymentId(r.getString("payment_id"));
        a.setCreatedAt(JdbcRepositorySupport.nullableDateTime(r,"created_at"));
        return a;
    }
}
