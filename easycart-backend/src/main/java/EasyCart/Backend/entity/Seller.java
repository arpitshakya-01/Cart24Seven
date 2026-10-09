package EasyCart.Backend.entity;

public class Seller extends User {
    @Override
    public String getDashboardPath() { return "/seller"; }
}
