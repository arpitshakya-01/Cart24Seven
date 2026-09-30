package EasyCart.Backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "products")
public class Product {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String productName;
    private String brand;
    @Column(length = 1000)
    private String description;
    @Column(length = 2048)
    private String imageUrl;
    private Double price;
    /** Taxable selling value before GST. price is the all-inclusive buyer price. */
    @Column(name = "base_price")
    private Double basePrice;
    @Column(name = "gst_rate")
    private Double gstRate = 18.0;
    @Column(name = "hsn_code", length = 20)
    private String hsnCode;
    @Column(name = "hsn_verified", nullable = false)
    private boolean hsnVerified = false;
    private Double mrp;
    private Double costPrice;
    private Double operatingCost;
    private Double platformFeePercent;
    private Double profitMarginPercent;
    private Double rating;
    private Integer stock;
    private Integer discount;
    @Column(name = "seller_email")
    private String sellerEmail;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    @JsonIgnoreProperties("products")
    private Category category;

    public Product() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public Double getBasePrice() { return basePrice; }
    public void setBasePrice(Double basePrice) { this.basePrice = basePrice; }
    public Double getGstRate() { return gstRate; }
    public void setGstRate(Double gstRate) { this.gstRate = gstRate; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public boolean isHsnVerified() { return hsnVerified; }
    public void setHsnVerified(boolean hsnVerified) { this.hsnVerified = hsnVerified; }
    public Double getMrp() { return mrp; }
    public void setMrp(Double mrp) { this.mrp = mrp; }
    public Double getCostPrice() { return costPrice; }
    public void setCostPrice(Double costPrice) { this.costPrice = costPrice; }
    public Double getOperatingCost() { return operatingCost; }
    public void setOperatingCost(Double operatingCost) { this.operatingCost = operatingCost; }
    public Double getPlatformFeePercent() { return platformFeePercent; }
    public void setPlatformFeePercent(Double platformFeePercent) { this.platformFeePercent = platformFeePercent; }
    public Double getProfitMarginPercent() { return profitMarginPercent; }
    public void setProfitMarginPercent(Double profitMarginPercent) { this.profitMarginPercent = profitMarginPercent; }
    public Double getRating() { return rating; }
    public void setRating(Double rating) { this.rating = rating; }
    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }
    public Integer getDiscount() { return discount; }
    public void setDiscount(Integer discount) { this.discount = discount; }
    public String getSellerEmail() { return sellerEmail; }
    public void setSellerEmail(String sellerEmail) { this.sellerEmail = sellerEmail; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
}
