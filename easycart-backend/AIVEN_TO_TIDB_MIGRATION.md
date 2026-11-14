# Move Cart24Seven data from Aiven MySQL to TiDB Cloud Starter

This guide keeps Aiven as the source until the TiDB copy has been imported and checked. Do not delete the Aiven service or connect the live app to an empty TiDB database.

## Current TiDB settings

The target is a TiDB Cloud Starter instance named `cart24seven-db`, configured for MySQL compatibility in Singapore with a monthly spending limit of `$0`. At that limit, TiDB throttles the instance if the free quota is exhausted instead of charging for overage. The free Starter allowance is currently 5 GiB of row storage and 50 million request units per month.

TiDB Starter requires TLS. Java's system certificate store can verify the TiDB public certificate; keep `sslMode=VERIFY_IDENTITY` in the JDBC URL. The TiDB username includes the account prefix shown on its Connect page (for example, `<prefix>.root`). Do not commit or share the password.

## 1. Recover the Aiven source

The Aiven `cart24seven-db` service is currently powered off. Powering it on restores Aiven's latest backup and replays its available MySQL transaction logs. The Aiven console may require a payment method after the platform trial expires, and the Developer service can incur charges. Check the Aiven billing screen before powering it on.

Wait for the service status to show **Running**. Do not reset its password, change its plan, or delete it as part of this data copy.

## 2. Export a local backup

Install the MySQL command-line client. Download the Aiven CA certificate from the service's Connection information panel. In Windows Command Prompt, run the following, replacing the host, port, and CA file path with the values shown in Aiven. The password prompt keeps the password out of the command history.

```bat
mysqldump --single-transaction --set-gtid-purged=OFF --no-tablespaces --hex-blob --default-character-set=utf8mb4 --ssl-mode=VERIFY_CA --ssl-ca="C:\\path\\to\\aiven-ca.pem" --host=YOUR_AIVEN_HOST --port=YOUR_AIVEN_PORT --user=avnadmin --password --result-file="cart24seven-aiven.sql" defaultdb
```

Keep `cart24seven-aiven.sql` outside the Git repository and do not share it. It contains account records and password hashes. `mysqldump` exits successfully only when the dump completes; keep the file as a rollback copy.

## 3. Import into TiDB before deploying the app

On the TiDB Connect page, get the public host, port, prefixed username, and CA certificate. Generate/set the TiDB password in the console and save it privately. Then import the SQL file into TiDB's `test` database from Command Prompt:

```bat
mysql --ssl-mode=VERIFY_IDENTITY --ssl-ca="C:\\path\\to\\tidb-ca.pem" --host=YOUR_TIDB_HOST --port=4000 --user=YOUR_PREFIX.root --password test < "cart24seven-aiven.sql"
```

The app must not be pointed at TiDB until this import completes. The import preserves primary keys, user emails, password hashes, products, orders, reviews, carts, payment attempts, and other rows present in the Aiven dump.

## 4. Verify before cutover

Run exact `COUNT(*)` queries for every table on Aiven and TiDB and compare the results. Confirm that admin, seller, and buyer rows exist, then test a login using an existing account after cutover. Never query or paste password hashes into logs or chat.

Keep Aiven powered on and unchanged until the TiDB counts match and the app has been checked against TiDB. If the rows do not match or the app fails, point Render back to Aiven and investigate; do not overwrite or delete either database.

## 5. Cut over the Render backend

After the data checks pass, update the `cart24seven-api` service environment in Render:

```text
SPRING_DATASOURCE_URL=jdbc:mysql://YOUR_TIDB_HOST:4000/test?sslMode=VERIFY_IDENTITY&serverTimezone=Asia/Kolkata
SPRING_DATASOURCE_USERNAME=YOUR_PREFIX.root
SPRING_DATASOURCE_PASSWORD=the-password-saved-from-TiDB
```

Save these values only in Render's private environment settings. Redeploy and verify the backend health endpoint, account login, product listings, cart, and order history. Leave Aiven intact until the new deployment has passed these checks.

## Notes

- The repository already reads the JDBC URL, username, and password from environment variables, so provider credentials belong in Render settings, not source code.
- Existing password hashes are copied as database values; passwords are not reset or rehashed during the copy.
- TiDB is MySQL-compatible but not identical to MySQL. This project's schema uses ordinary tables and JDBC queries, but the app still needs live verification after import.
- Uploaded image/video files are stored separately from MySQL. This database migration does not copy files from the backend's uploads directory.
