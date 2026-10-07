package EasyCart.Backend.controller;

import EasyCart.Backend.repository.JdbcRepositorySupport;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins="${APP_FRONTEND_ORIGIN:http://localhost:5173}")
public class ReviewController {
  private final JdbcRepositorySupport jdbc;
  public ReviewController(JdbcRepositorySupport jdbc) { this.jdbc=jdbc; }

  @GetMapping("/products/{id}")
  public List<ProductReview> productReviews(@PathVariable Long id) { return jdbc.query("SELECT id,product_id,order_id,buyer_name,rating,comment,created_at FROM product_reviews WHERE product_id=? ORDER BY created_at DESC", r -> new ProductReview(r.getLong("id"),r.getLong("product_id"),r.getLong("order_id"),r.getString("buyer_name"),r.getInt("rating"),r.getString("comment"),r.getTimestamp("created_at").toLocalDateTime()),id); }

  @PostMapping("/products/{id}")
  public ProductReview addProductReview(@PathVariable Long id,@RequestBody ReviewRequest request,Authentication auth) {
    validate(request); Long orderId=request.orderId();
    var order=jdbc.queryOne("SELECT id,product_id,order_status,customer_name FROM orders WHERE id=? AND LOWER(buyer_email)=LOWER(?)",r -> new Object[]{r.getLong("id"),JdbcRepositorySupport.nullableLong(r,"product_id"),r.getString("order_status"),r.getString("customer_name")},orderId,auth.getName()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,"Eligible order not found."));
    Object[] row=(Object[])order; if (row[1]==null || !id.equals(row[1]) || !"Delivered".equalsIgnoreCase((String)row[2])) throw new ResponseStatusException(HttpStatus.CONFLICT,"You can review this product after its delivery.");
    jdbc.update("INSERT INTO product_reviews(product_id,order_id,buyer_email,buyer_name,rating,comment,created_at) VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating),comment=VALUES(comment),created_at=VALUES(created_at)",id,orderId,auth.getName(),row[3],request.rating(),clean(request.comment()),LocalDateTime.now());
    return jdbc.queryOne("SELECT id,product_id,order_id,buyer_name,rating,comment,created_at FROM product_reviews WHERE order_id=?",r -> new ProductReview(r.getLong("id"),r.getLong("product_id"),r.getLong("order_id"),r.getString("buyer_name"),r.getInt("rating"),r.getString("comment"),r.getTimestamp("created_at").toLocalDateTime()),orderId).orElseThrow();
  }

  @GetMapping("/orders/{id}")
  public OrderReview orderReview(@PathVariable Long id,Authentication auth) {
    requireOrder(id,auth.getName());
    return jdbc.queryOne("SELECT order_id,rating,comment,delivery_feedback,created_at FROM order_reviews WHERE order_id=?",r -> new OrderReview(r.getLong("order_id"),r.getInt("rating"),r.getString("comment"),r.getString("delivery_feedback"),r.getTimestamp("created_at").toLocalDateTime()),id).orElse(null);
  }

  @PostMapping("/orders/{id}")
  public OrderReview saveOrderReview(@PathVariable Long id,@RequestBody OrderReviewRequest request,Authentication auth) {
    validate(request); requireOrder(id,auth.getName());
    var order=jdbc.queryOne("SELECT order_status FROM orders WHERE id=? AND LOWER(buyer_email)=LOWER(?)",r -> r.getString(1),id,auth.getName()).orElseThrow();
    if (!"Delivered".equalsIgnoreCase(order)) throw new ResponseStatusException(HttpStatus.CONFLICT,"You can review an order after it is delivered.");
    String feedback=request.deliveryFeedback(); if (feedback!=null && !List.of("great","okay","needs-improvement").contains(feedback)) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a valid delivery rating.");
    String comment=clean(request.comment());
    jdbc.update("INSERT INTO order_reviews(order_id,buyer_email,rating,comment,delivery_feedback,created_at) VALUES(?,?,?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating),comment=VALUES(comment),delivery_feedback=VALUES(delivery_feedback),created_at=VALUES(created_at)",id,auth.getName(),request.rating(),comment,feedback,LocalDateTime.now());
    return orderReview(id,auth);
  }
  private void requireOrder(Long id,String email) { if (jdbc.queryOne("SELECT id FROM orders WHERE id=? AND LOWER(buyer_email)=LOWER(?)",r -> r.getLong(1),id,email).isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Order not found in your account."); }
  private void validate(ReviewRequest request) { if (request==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a rating from one to five stars."); validateRating(request.rating()); }
  private void validate(OrderReviewRequest request) { if (request==null) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a rating from one to five stars."); validateRating(request.rating()); }
  private void validateRating(int rating) { if (rating<1 || rating>5) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Choose a rating from one to five stars."); }
  private String clean(String text) { if (text==null) return null; String value=text.trim(); if (value.length()>1000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Review must be 1,000 characters or fewer."); return value.isEmpty()?null:value; }
  public record ReviewRequest(Long orderId,int rating,String comment) {}
  public record OrderReviewRequest(int rating,String comment,String deliveryFeedback) {}
  public record ProductReview(Long id,Long productId,Long orderId,String buyerName,int rating,String comment,LocalDateTime createdAt) {}
  public record OrderReview(Long orderId,int rating,String comment,String deliveryFeedback,LocalDateTime createdAt) {}
}
