package EasyCart.Backend.repository;

import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class JdbcRepositorySupport {
    @FunctionalInterface
    public interface RowMapper<T> { T map(ResultSet row) throws SQLException; }

    private final DataSource dataSource;

    public JdbcRepositorySupport(DataSource dataSource) { this.dataSource = dataSource; }

    public <T> List<T> query(String sql, RowMapper<T> mapper, Object... values) {
        Connection connection = DataSourceUtils.getConnection(dataSource);
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            bind(statement, values);
            try (ResultSet rows = statement.executeQuery()) {
                List<T> result = new ArrayList<>();
                while (rows.next()) result.add(mapper.map(rows));
                return result;
            }
        } catch (SQLException exception) {
            throw failure("query database", exception);
        } finally {
            DataSourceUtils.releaseConnection(connection, dataSource);
        }
    }

    public <T> Optional<T> queryOne(String sql, RowMapper<T> mapper, Object... values) {
        List<T> results = query(sql, mapper, values);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public int update(String sql, Object... values) {
        Connection connection = DataSourceUtils.getConnection(dataSource);
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            bind(statement, values);
            return statement.executeUpdate();
        } catch (SQLException exception) {
            throw failure("update database", exception);
        } finally {
            DataSourceUtils.releaseConnection(connection, dataSource);
        }
    }

    public long insert(String sql, Object... values) {
        Connection connection = DataSourceUtils.getConnection(dataSource);
        try (PreparedStatement statement = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            bind(statement, values);
            statement.executeUpdate();
            try (ResultSet keys = statement.getGeneratedKeys()) {
                if (!keys.next()) throw new SQLException("The database did not return a generated ID.");
                return keys.getLong(1);
            }
        } catch (SQLException exception) {
            throw failure("insert database record", exception);
        } finally {
            DataSourceUtils.releaseConnection(connection, dataSource);
        }
    }

    private void bind(PreparedStatement statement, Object[] values) throws SQLException {
        for (int i = 0; i < values.length; i++) {
            Object value = values[i];
            if (value instanceof LocalDateTime dateTime) statement.setTimestamp(i + 1, Timestamp.valueOf(dateTime));
            else statement.setObject(i + 1, value);
        }
    }

    public static Double nullableDouble(ResultSet row, String column) throws SQLException {
        double value = row.getDouble(column);
        return row.wasNull() ? null : value;
    }

    public static Integer nullableInt(ResultSet row, String column) throws SQLException {
        int value = row.getInt(column);
        return row.wasNull() ? null : value;
    }

    public static Long nullableLong(ResultSet row, String column) throws SQLException {
        long value = row.getLong(column);
        return row.wasNull() ? null : value;
    }

    public static LocalDateTime nullableDateTime(ResultSet row, String column) throws SQLException {
        Timestamp value = row.getTimestamp(column);
        return value == null ? null : value.toLocalDateTime();
    }

    private DataAccessResourceFailureException failure(String operation, SQLException cause) {
        return new DataAccessResourceFailureException("Could not " + operation + " using the configured MySQL connection.", cause);
    }
}
