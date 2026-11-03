package EasyCart.Backend.config;

import EasyCart.Backend.repository.JdbcRepositorySupport;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class EmailVerificationSchemaMigration implements CommandLineRunner {
    private final JdbcRepositorySupport jdbc;

    public EmailVerificationSchemaMigration(JdbcRepositorySupport jdbc) { this.jdbc = jdbc; }

    @Override
    public void run(String... args) {
        boolean columnExists = !jdbc.query("SELECT column_name FROM information_schema.columns " +
                        "WHERE table_schema=DATABASE() AND table_name='users' AND column_name='email_verified'",
                row -> row.getString("column_name")).isEmpty();
        if (!columnExists) jdbc.update("ALTER TABLE users ADD COLUMN email_verified BIT(1) NOT NULL DEFAULT b'1'");
    }
}
