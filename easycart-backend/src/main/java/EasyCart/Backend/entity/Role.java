package EasyCart.Backend.entity;

import java.util.Locale;

public enum Role {
    BUYER, SELLER, ADMIN;

    public static Role from(String value) {
        if (value == null || value.isBlank()) return BUYER;
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("USER")) normalized = "BUYER";
        try { return Role.valueOf(normalized); }
        catch (IllegalArgumentException exception) { throw new IllegalArgumentException("Role must be ADMIN, SELLER, or BUYER."); }
    }
}
