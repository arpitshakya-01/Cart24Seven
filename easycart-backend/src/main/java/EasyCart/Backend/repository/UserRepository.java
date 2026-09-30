package EasyCart.Backend.repository;

import EasyCart.Backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);
    Optional<User> findByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
}
