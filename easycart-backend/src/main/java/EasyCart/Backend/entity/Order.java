package EasyCart.Backend.entity;

import java.time.LocalDateTime;
public class Order {
    private Long id;
    private String customerName;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private String productName;
    private String productImage;
    private Double productPrice;
    private Double productCostPrice;
    private Double productOperatingCost;
    private Double productPlatformFeePercent;
    private Integer quantity;
    private Double subtotal;
    private Double gst;
    private Double taxableValue;
    private Double gstRate;
    private Double cgst;
    private Double sgst;
    private Double igst;
    private String hsnCode;
    private String sellerState;
    private String sellerGstin;
    private Double marketplaceCommission;
    private Double commissionGst;
    private Double tcs;
    private Double tcsCgst;
    private Double tcsSgst;
    private Double tcsIgst;
    private Double netSellerPayout;
    private Double deliveryCharge;
    private Double totalAmount;
    private String orderStatus;
    private LocalDateTime orderDate;
    private String buyerEmail;
    private String sellerEmail;
    private Long productId;
    private String paymentMethod;
    private String paymentStatus;
    private String paymentReference;

    public Order() { this.orderDate = LocalDateTime.now(); this.orderStatus = "Placed"; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getProductImage() { return productImage; }
    public void setProductImage(String productImage) { this.productImage = productImage; }
    public Double getProductPrice() { return productPrice; }
    public void setProductPrice(Double productPrice) { this.productPrice = productPrice; }
    public Double getProductCostPrice() { return productCostPrice; }
    public void setProductCostPrice(Double productCostPrice) { this.productCostPrice = productCostPrice; }
    public Double getProductOperatingCost() { return productOperatingCost; }
    public void setProductOperatingCost(Double productOperatingCost) { this.productOperatingCost = productOperatingCost; }
    public Double getProductPlatformFeePercent() { return productPlatformFeePercent; }
    public void setProductPlatformFeePercent(Double productPlatformFeePercent) { this.productPlatformFeePercent = productPlatformFeePercent; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    public Double getGst() { return gst; }
    public void setGst(Double gst) { this.gst = gst; }
    public Double getTaxableValue() { return taxableValue; }
    public void setTaxableValue(Double value) { this.taxableValue = value; }
    public Double getGstRate() { return gstRate; }
    public void setGstRate(Double value) { this.gstRate = value; }
    public Double getCgst() { return cgst; }
    public void setCgst(Double value) { this.cgst = value; }
    public Double getSgst() { return sgst; }
    public void setSgst(Double value) { this.sgst = value; }
    public Double getIgst() { return igst; }
    public void setIgst(Double value) { this.igst = value; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String value) { this.hsnCode = value; }
    public String getSellerState() { return sellerState; }
    public void setSellerState(String value) { this.sellerState = value; }
    public String getSellerGstin() { return sellerGstin; }
    public void setSellerGstin(String value) { this.sellerGstin = value; }
    public Double getMarketplaceCommission() { return marketplaceCommission; }
    public void setMarketplaceCommission(Double value) { this.marketplaceCommission = value; }
    public Double getCommissionGst() { return commissionGst; }
    public void setCommissionGst(Double value) { this.commissionGst = value; }
    public Double getTcs() { return tcs; }
    public void setTcs(Double value) { this.tcs = value; }
    public Double getTcsCgst() { return tcsCgst; }
    public void setTcsCgst(Double value) { this.tcsCgst = value; }
    public Double getTcsSgst() { return tcsSgst; }
    public void setTcsSgst(Double value) { this.tcsSgst = value; }
    public Double getTcsIgst() { return tcsIgst; }
    public void setTcsIgst(Double value) { this.tcsIgst = value; }
    public Double getNetSellerPayout() { return netSellerPayout; }
    public void setNetSellerPayout(Double value) { this.netSellerPayout = value; }
    public Double getDeliveryCharge() { return deliveryCharge; }
    public void setDeliveryCharge(Double deliveryCharge) { this.deliveryCharge = deliveryCharge; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public LocalDateTime getOrderDate() { return orderDate; }
    public void setOrderDate(LocalDateTime orderDate) { this.orderDate = orderDate; }
    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }
    public String getSellerEmail() { return sellerEmail; }
    public void setSellerEmail(String sellerEmail) { this.sellerEmail = sellerEmail; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String value) { this.paymentMethod = value; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String value) { this.paymentStatus = value; }
    public String getPaymentReference() { return paymentReference; }
    public void setPaymentReference(String value) { this.paymentReference = value; }
}

