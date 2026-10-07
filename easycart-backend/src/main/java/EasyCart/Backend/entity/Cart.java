package EasyCart.Backend.entity;

import java.util.ArrayList;
import java.util.List;
public class Cart {
    private Long id;
    private String buyerEmail;
    private List<CartItem> items = new ArrayList<>();

    public Cart() {}
    public Cart(String buyerEmail) { this.buyerEmail = buyerEmail; }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBuyerEmail() { return buyerEmail; }
    public void setBuyerEmail(String buyerEmail) { this.buyerEmail = buyerEmail; }
    public List<CartItem> getItems() { return items; }
    public void setItems(List<CartItem> items) { this.items = items; }
}


