# Cart24Seven - E-commerce Marketplace

Cart24Seven is a full-stack marketplace where buyers browse and order products, sellers manage products and orders, and administrators manage the marketplace.

## Features

- Buyer, seller, and admin accounts with role-based access
- Product browsing, search, categories, image/video galleries, and reviews
- Shopping cart, checkout, order tracking, and order reviews
- Seller product and order management, including media uploads
- Admin product, user, seller-verification, and order management
- GST/tax breakdowns, marketplace calculations, and delivery charges
- Cash on delivery and demo payments; optional Razorpay integration

## Technology stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS, Axios
- **Backend:** Java 17, Spring Boot, Spring MVC, Spring Security, JWT
- **Database:** MySQL 8 with direct JDBC and prepared statements
- **Deployment:** Render for the frontend and API; Aiven MySQL for the hosted database; Docker for the API container

The repository also contains `easycart-frontend/vercel.json` for client-side route rewrites. The deployment described by `render.yaml` uses Render as the primary host.

## Project structure

- `easycart-frontend/` - React/Vite website
- `easycart-backend/` - Spring Boot API and JDBC repositories
- `easycart-backend/src/main/resources/schema.sql` - creates missing database tables
- `easycart-backend/uploads/` and `uploads/` - bundled and uploaded media
- `render.yaml` - Render frontend and API service configuration
- `PROJECT_STRUCTURE.md` - expanded folder and file chart

## Run the project locally

### Requirements

Install these on the computer running the project:

- Java Development Kit (JDK) 17 or newer
- Node.js 20.19 or newer, or 22.12 or newer, with npm
- MySQL Server 8.x, running locally
- Git, if you are cloning the project from GitHub

### 1. Get the code

Clone the repository, or download and extract the project ZIP:

```bash
git clone https://github.com/arpitshakya-01/Cart24Seven.git
cd Cart24Seven
```

### 2. Create a local MySQL database

Start the MySQL service. You can create the database with MySQL Workbench or a MySQL command-line client:

```sql
CREATE DATABASE easycart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Use a local MySQL account that has permission to connect to this database. When the backend starts, Spring runs `schema.sql` to create missing tables. It does not erase existing rows. Existing databases must have the columns required by the current application.

### 3. Set local database and password values

Set these environment variables in the terminal that will run the backend. Replace the example placeholders with your own local values. The commands below are for Windows PowerShell:

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/easycart_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata"
$env:SPRING_DATASOURCE_USERNAME = "YOUR_LOCAL_MYSQL_USERNAME"
$env:SPRING_DATASOURCE_PASSWORD = "ENTER_YOUR_LOCAL_MYSQL_PASSWORD_HERE"
$env:CART24SEVEN_JWT_SECRET = "ENTER_A_RANDOM_SECRET_AT_LEAST_32_BYTES_LONG"
```

For macOS/Linux, use the equivalent `export NAME="value"` commands in the terminal that starts the backend. These are example placeholders, not working credentials. Do not commit real passwords, database URLs containing credentials, JWT secrets, or payment keys to GitHub. The root `.gitignore` excludes `.env` files; keep real local settings in an ignored file or terminal environment, not in this README.

### 4. Optional: configure a local admin account

To create or update an admin account at backend startup, set these variables before starting the backend:

```powershell
$env:CART24SEVEN_ADMIN_EMAIL = "your-admin-email@example.com"
$env:CART24SEVEN_ADMIN_PASSWORD = "ENTER_YOUR_ADMIN_PASSWORD_HERE"
$env:CART24SEVEN_ADMIN_NAME = "Site Administrator"
```

Choose a password of at least 8 characters. While these bootstrap variables are set, the configured password is applied again each time the backend starts. After the admin account has been created, remove or clear the bootstrap email and password if you do not want startup to reset that account's password. Do not write the real password into this README or commit it to GitHub.

For the live Render deployment, enter database and admin values in the Render backend service's Environment settings. Never put production passwords in this repository. Razorpay is optional; without its keys, Razorpay checkout is unavailable. Demo payment behavior is controlled by `CART24SEVEN_DEMO_PAYMENTS_ENABLED`.

### 5. Start the backend

Keep the terminal open so the environment variables remain available. From the project root, run:

```powershell
cd easycart-backend
.\mvnw.cmd spring-boot:run
```

On macOS/Linux, run `./mvnw spring-boot:run`. The API starts at `http://localhost:8080` by default. The product endpoint is `http://localhost:8080/api/products`.

### 6. Start the frontend

Open a second terminal at the project root:

```powershell
cd easycart-frontend
npm ci
npm run dev
```

Open the local Vite address shown in the terminal, normally `http://localhost:5173`. In development, the frontend defaults to the local backend at `http://localhost:8080/api`.

If you need to set the API address yourself, create `easycart-frontend/.env.local` with:

```text
VITE_API_URL=http://localhost:8080/api
```

Restart Vite after changing `.env.local`. Do not use the production database password in this file; the frontend should only contain the API URL, never database credentials.

## Build the project

Frontend production build:

```bash
cd easycart-frontend
npm ci
npm run build
```

Backend package build on Windows PowerShell:

```powershell
cd easycart-backend
.\mvnw.cmd -DskipTests package
```

On macOS/Linux, use `./mvnw -DskipTests package`.

## Deployment overview

`render.yaml` declares two Render services:

1. `cart24seven-site` builds the React/Vite frontend and publishes the `dist` directory.
2. `cart24seven-api` builds and runs the Spring Boot API using the backend Dockerfile.

The API connects to the hosted MySQL database using `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, and `SPRING_DATASOURCE_PASSWORD` in its hosting environment. The frontend receives the API address through `VITE_API_URL`. Uploaded files use the backend uploads directory; confirm persistent file storage is configured before relying on user-uploaded files across redeploys.

## Troubleshooting

- **Database connection refused:** Make sure MySQL is running and the URL, username, password, and database name are correct in the backend terminal environment.
- **Access denied for MySQL user:** Check the local MySQL user's password and database permissions.
- **Frontend cannot reach the API:** Confirm the backend is running on port 8080, check `VITE_API_URL`, and restart Vite after changing it.
- **npm reports an unsupported Node version:** Install Node.js 20.19+ or 22.12+ and run `npm ci` again.
- **Old database schema errors:** Back up any important data before changing schemas. `schema.sql` creates tables but does not migrate all older table layouts.

## Security reminders

- Never commit real passwords, API keys, JWT secrets, or production database credentials.
- Use separate local and production database credentials.
- Keep the actual password values in local environment variables or the hosting provider's secret settings, not in README examples.
- Do not share screenshots that expose passwords or secret values.

More details about JDBC setup are in [`easycart-backend/JDBC_SETUP.md`](easycart-backend/JDBC_SETUP.md).
