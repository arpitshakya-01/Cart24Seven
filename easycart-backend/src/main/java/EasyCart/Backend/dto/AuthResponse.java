package EasyCart.Backend.dto;

public class AuthResponse {

    private String token;
    private String name;
    private String email;
    private String role;
    private String dashboardPath;

    // Empty Constructor
    public AuthResponse() {
    }

    // Constructor
    public AuthResponse(String token, String name, String email, String role) {
        this.token = token;
        this.name = name;
        this.email = email;
        this.role = role;
    }

    public AuthResponse(String token, String name, String email, String role, String dashboardPath) {
        this(token, name, email, role);
        this.dashboardPath = dashboardPath;
    }

    // Getters and Setters

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getDashboardPath() { return dashboardPath; }
    public void setDashboardPath(String dashboardPath) { this.dashboardPath = dashboardPath; }
}
