package EasyCart.Backend.dto;

public record DeliveryAddress(String fullName, String phone, String addressLine,
                              String city, String state, String pincode) {}
