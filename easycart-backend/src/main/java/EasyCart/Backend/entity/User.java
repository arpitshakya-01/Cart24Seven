package EasyCart.Backend.entity;

import java.util.Locale;
public class User {
    private Long id;
    private String name;
    private String email;
    private String password;
    private String role = Role.BUYER.name();
    private String phone;
    private String addressLine;
    private String city;
    private String state;
    private String pincode;
    private String paymentPreference;
    private String gstin;
    private String gstinStatus = "NOT_SUBMITTED";

    public User() {}
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = Role.from(role).name(); }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddressLine() { return addressLine; }
    public void setAddressLine(String addressLine) { this.addressLine = addressLine; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }
    public String getPaymentPreference() { return paymentPreference; }
    public void setPaymentPreference(String paymentPreference) { this.paymentPreference = paymentPreference; }
    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin == null ? null : gstin.trim().toUpperCase(Locale.ROOT); }
    public String getGstinStatus() { return gstinStatus; }
    public void setGstinStatus(String gstinStatus) { this.gstinStatus = gstinStatus == null ? "NOT_SUBMITTED" : gstinStatus.trim().toUpperCase(Locale.ROOT); }
}

