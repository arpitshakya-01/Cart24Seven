package EasyCart.Backend.dto;

import EasyCart.Backend.entity.Category;
import EasyCart.Backend.entity.Product;

public class ProductResponse {
    private Long id;
    private String productName;
    private String brand;
    private String description;
    private String imageUrl;
    private Double price;
    private Double basePrice;
    private Double gstRate;
    private String hsnCode;
    private boolean hsnVerified;
    private Double mrp;
    private Double rating;
    private Integer stock;
    private Integer discount;
    private String sellerEmail;
    private Category category;

    public ProductResponse(Product product) {
        this.id = product.getId();
        this.productName = product.getProductName();
        this.brand = product.getBrand();
        this.description = product.getDescription();
        this.imageUrl = product.getImageUrl();
        this.price = product.getPrice();
        this.basePrice = product.getBasePrice();
        this.gstRate = product.getGstRate() == null ? 18.0 : product.getGstRate();
        this.hsnCode = product.getHsnCode();
        this.hsnVerified = product.isHsnVerified();
        this.mrp = product.getMrp() == null ? product.getPrice() : product.getMrp();
        this.rating = product.getRating();
        this.stock = product.getStock();
        this.discount = product.getDiscount() == null ? null : product.getDiscount().intValue();
        this.sellerEmail = product.getSellerEmail();
        this.category = product.getCategory();
    }

    public Long getId() { return id; }
    public String getProductName() { return productName; }
    public String getBrand() { return brand; }
    public String getDescription() { return description; }
    public String getImageUrl() { return imageUrl; }
    public Double getPrice() { return price; }
    public Double getBasePrice() { return basePrice; }
    public Double getGstRate() { return gstRate; }
    public String getHsnCode() { return hsnCode; }
    public boolean isHsnVerified() { return hsnVerified; }
    public Double getMrp() { return mrp; }
    public Double getRating() { return rating; }
    public Integer getStock() { return stock; }
    public Integer getDiscount() { return discount; }
    public String getSellerEmail() { return sellerEmail; }
    public Category getCategory() { return category; }
}
