# EasyCart backend: JDBC setup

The backend uses Java JDBC repositories with SQL prepared statements. Configure the MySQL URL, username, and password with the spring.datasource properties in src/main/resources/application.properties (or provide the same Spring properties as environment variables).

On startup, Spring runs src/main/resources/schema.sql. The script creates the EasyCart tables only when they do not already exist; it does not drop tables or delete existing rows. Existing databases must already contain the current columns used by the application.

The JDBC repositories use the configured Spring DataSource. They obtain connections through Spring's transaction-aware connection utilities so checkout and other transactional operations share a database transaction.
