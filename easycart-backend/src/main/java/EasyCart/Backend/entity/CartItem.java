package EasyCart.Backend.entity;
public class CartItem {
    private Long id;
    private Cart cart;
    private Product product;
    private Integer quantity;

    public CartItem() {}
    public CartItem(Cart cart, Product product, Integer quantity) {
        this.cart = cart; this.product = product; this.quantity = quantity;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Cart getCart() { return cart; }
    public void setCart(Cart cart) { this.cart = cart; }
    public Product getProduct() { return product; }
    public void setProduct(Product product) { this.product = product; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}


