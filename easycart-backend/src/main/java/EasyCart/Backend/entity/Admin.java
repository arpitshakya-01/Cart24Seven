package EasyCart.Backend.entity;

public class Admin extends User {
    @Override
    public String getDashboardPath() { return "/admin"; }
}
