# Cart24Seven — Ecommerce Platform

Cart24Seven is a full-stack ecommerce platform with a React storefront and a Java Spring Boot backend. The backend uses direct JDBC with MySQL for persistence.

## Features

- Buyer, seller, and admin accounts with role-based access
- Product browsing, search, categories, image/video galleries, and customer reviews
- Shopping cart, checkout, order tracking, cancellation, and order reviews
- Seller product and order management, including media uploads
- Admin product/user/order management and seller HSN verification
- GST-inclusive pricing, order tax breakdowns, and delivery charges (₹40 below ₹499; free from ₹499)
- Cash on delivery and demo payments; optional Razorpay integration when configured

## Technology

- **Frontend:** React, Vite, React Router, Tailwind CSS
- **Backend:** Java 17+, Spring Boot, Spring MVC, Spring Security, JWT
- **Database:** MySQL with direct JDBC and prepared statements

## Project layout

```text
.
├── easycart-frontend/    # React/Vite application
├── easycart-backend/     # Spring Boot API and JDBC repositories
├── uploads/              # Uploaded product media (created/used by the backend)
└── README.md
```

## Prerequisites

- Java 17 or newer
- MySQL Server
- Node.js and npm compatible with the Vite version in `easycart-frontend/package.json`

## Configure MySQL and the JWT secret

The backend reads the MySQL connection from Spring Boot configuration. For local development, set environment overrides in PowerShell before starting the backend. Replace the example values with your own local database settings and a long, random JWT secret:

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/easycart_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=Asia/Kolkata"
$env:SPRING_DATASOURCE_USERNAME = "your_mysql_username"
$env:SPRING_DATASOURCE_PASSWORD = "your_mysql_password"
$env:CART24SEVEN_JWT_SECRET = "replace-with-a-long-random-secret"
```

Do not commit real passwords, JWT secrets, or payment keys to GitHub. The optional first-admin bootstrap can be configured with `CART24SEVEN_ADMIN_EMAIL`, `CART24SEVEN_ADMIN_PASSWORD`, and `CART24SEVEN_ADMIN_NAME`. Razorpay can be enabled with `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; without those keys, online Razorpay checkout is unavailable. Demo payments are controlled by `CART24SEVEN_DEMO_PAYMENTS_ENABLED`.

On startup, Spring executes `easycart-backend/src/main/resources/schema.sql`. It creates missing tables but does not drop tables or delete existing rows. Existing databases should already have the columns expected by the current application.

## Run the backend

From PowerShell at the project root:

```powershell
cd easycart-backend
.\mvnw.cmd spring-boot:run
```

The API runs at `http://localhost:8080` by default.

## Run the frontend

Open a second terminal at the project root:

```powershell
cd easycart-frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The frontend uses `http://localhost:8080/api` by default. To point it at a different backend, create `easycart-frontend/.env.local` with:

```text
VITE_API_URL=http://localhost:8080/api
```

Restart the Vite server after changing frontend environment variables.

## Build commands

```powershell
# Frontend production build
cd easycart-frontend
npm run build

# Backend compile
cd ..\easycart-backend
.\mvnw.cmd -DskipTests compile
```

## Notes

- Uploaded images and videos are stored in the backend's `uploads/` directory and served from `/uploads/`.
- Keep database credentials and local-only configuration out of version control. Review `easycart-backend/src/main/resources/application.properties` before publishing the repository.
- More JDBC-specific setup information is available in `easycart-backend/JDBC_SETUP.md`.
