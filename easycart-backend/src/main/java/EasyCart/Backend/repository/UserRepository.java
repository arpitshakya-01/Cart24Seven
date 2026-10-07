package EasyCart.Backend.repository;

import EasyCart.Backend.entity.User;
import EasyCart.Backend.entity.Role;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Optional;

@Repository
public class UserRepository {
    private static final String COLUMNS = "id, name, email, password, role, phone, address_line, city, state, pincode, payment_preference, gstin, gstin_status";
    private final JdbcRepositorySupport jdbc;

    public UserRepository(JdbcRepositorySupport jdbc) { this.jdbc = jdbc; }

    public User save(User user) {
        user.setName(user.getName() == null ? null : user.getName().trim());
        user.setEmail(user.getEmail() == null ? null : user.getEmail().trim().toLowerCase(java.util.Locale.ROOT));
        user.setRole(Role.from(user.getRole()).name());
        if (user.getGstinStatus() == null) user.setGstinStatus("NOT_SUBMITTED");
        if (user.getId() == null) {
            String sql = "INSERT INTO users (name,email,password,role,phone,address_line,city,state,pincode,payment_preference,gstin,gstin_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)";
            user.setId(jdbc.insert(sql, values(user)));
        } else {
            String sql = "UPDATE users SET name=?,email=?,password=?,role=?,phone=?,address_line=?,city=?,state=?,pincode=?,payment_preference=?,gstin=?,gstin_status=? WHERE id=?";
            Object[] values = values(user);
            Object[] withId = java.util.Arrays.copyOf(values, values.length + 1);
            withId[values.length] = user.getId();
            if (jdbc.update(sql, withId) == 0) throw new org.springframework.dao.EmptyResultDataAccessException("User not found", 1);
        }
        return user;
    }

    private Object[] values(User user) {
        return new Object[]{user.getName(), user.getEmail(), user.getPassword(), user.getRole(), user.getPhone(),
                user.getAddressLine(), user.getCity(), user.getState(), user.getPincode(), user.getPaymentPreference(),
                user.getGstin(), user.getGstinStatus()};
    }

    public List<User> findAll() { return jdbc.query("SELECT " + COLUMNS + " FROM users ORDER BY id", this::map); }
    public Optional<User> findById(Long id) { return jdbc.queryOne("SELECT " + COLUMNS + " FROM users WHERE id=?", this::map, id); }
    public Optional<User> findByEmailIgnoreCase(String email) { return byEmail("LOWER(email)=LOWER(?)", email); }
    public Optional<User> findByEmail(String email) { return byEmail("email=?", email); }
    private Optional<User> byEmail(String predicate, String email) { return jdbc.queryOne("SELECT " + COLUMNS + " FROM users WHERE " + predicate + " LIMIT 1", this::map, email); }
    public boolean existsByEmailIgnoreCase(String email) { return findByEmailIgnoreCase(email).isPresent(); }
    public boolean existsByEmail(String email) { return findByEmail(email).isPresent(); }
    public void delete(User user) { jdbc.update("DELETE FROM users WHERE id=?", user.getId()); }

    private User map(ResultSet row) throws SQLException {
        User user = new User();
        user.setId(row.getLong("id"));
        user.setName(row.getString("name"));
        user.setEmail(row.getString("email"));
        user.setPassword(row.getString("password"));
        user.setRole(row.getString("role"));
        user.setPhone(row.getString("phone"));
        user.setAddressLine(row.getString("address_line"));
        user.setCity(row.getString("city"));
        user.setState(row.getString("state"));
        user.setPincode(row.getString("pincode"));
        user.setPaymentPreference(row.getString("payment_preference"));
        user.setGstin(row.getString("gstin"));
        user.setGstinStatus(row.getString("gstin_status"));
        return user;
    }
}
