# Project Folder and File Chart

This chart lists the project files and folders. Generated build output, installed dependencies, and IDE metadata are omitted. Uploaded media files are listed by filename.

```text
Ecommerce Project using Java/
├── .github/
│   └── modernize/
│       └── java-upgrade/
│           ├── hooks/
│           │   ├── scripts/
│           │   │   ├── recordToolUse.ps1
│           │   │   └── recordToolUse.sh
│           │   └── 4d94e82e-0611-4ea1-8dd3-03bc2b2172b5.json
│           └── .gitignore
├── easycart-backend/
│   ├── .github/
│   │   └── modernize/
│   │       └── java-upgrade/
│   │           ├── 20260930171721/
│   │           │   └── logs/
│   │           │       └── 0.log
│   │           ├── hooks/
│   │           │   └── scripts/
│   │           │       ├── recordToolUse.ps1
│   │           │       └── recordToolUse.sh
│   │           └── .gitignore
│   ├── .mvn/
│   │   └── wrapper/
│   │       └── maven-wrapper.properties
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   │   └── EasyCart/
│   │   │   │       └── Backend/
│   │   │   │           ├── config/
│   │   │   │           │   ├── AdminBootstrap.java
│   │   │   │           │   ├── JwtFilter.java
│   │   │   │           │   ├── JwtService.java
│   │   │   │           │   ├── SecurityConfig.java
│   │   │   │           │   └── WebConfig.java
│   │   │   │           ├── controller/
│   │   │   │           │   ├── AdminUserController.java
│   │   │   │           │   ├── AuthController.java
│   │   │   │           │   ├── BuyerProfileController.java
│   │   │   │           │   ├── CartController.java
│   │   │   │           │   ├── CategoryController.java
│   │   │   │           │   ├── HomeController.java
│   │   │   │           │   ├── OrderController.java
│   │   │   │           │   ├── ProductController.java
│   │   │   │           │   ├── ProductPricing.java
│   │   │   │           │   ├── ReviewController.java
│   │   │   │           │   ├── SellerController.java
│   │   │   │           │   └── UploadController.java
│   │   │   │           ├── dto/
│   │   │   │           │   ├── AuthResponse.java
│   │   │   │           │   ├── CategoryDTO.java
│   │   │   │           │   ├── LoginRequest.java
│   │   │   │           │   ├── ProductDTO.java
│   │   │   │           │   ├── ProductResponse.java
│   │   │   │           │   └── RegisterRequest.java
│   │   │   │           ├── entity/
│   │   │   │           │   ├── Cart.java
│   │   │   │           │   ├── CartItem.java
│   │   │   │           │   ├── Category.java
│   │   │   │           │   ├── Order.java
│   │   │   │           │   ├── PaymentAttempt.java
│   │   │   │           │   ├── Product.java
│   │   │   │           │   ├── ProductMedia.java
│   │   │   │           │   ├── Role.java
│   │   │   │           │   └── User.java
│   │   │   │           ├── exception/
│   │   │   │           │   ├── CategoryNotFoundException.java
│   │   │   │           │   ├── GlobalExceptionHandler.java
│   │   │   │           │   └── ProductNotFoundException.java
│   │   │   │           ├── repository/
│   │   │   │           │   ├── CartItemRepository.java
│   │   │   │           │   ├── CartRepository.java
│   │   │   │           │   ├── CategoryRepository.java
│   │   │   │           │   ├── JdbcRepositorySupport.java
│   │   │   │           │   ├── OrderRepository.java
│   │   │   │           │   ├── PaymentAttemptRepository.java
│   │   │   │           │   ├── ProductMediaRepository.java
│   │   │   │           │   ├── ProductRepository.java
│   │   │   │           │   └── UserRepository.java
│   │   │   │           ├── service/
│   │   │   │           │   ├── AuthService.java
│   │   │   │           │   ├── CategoryService.java
│   │   │   │           │   ├── ProductPricingInitializer.java
│   │   │   │           │   ├── ProductService.java
│   │   │   │           │   └── RazorpayPaymentService.java
│   │   │   │           ├── serviceImpl/
│   │   │   │           │   ├── CategoryServiceImpl.java
│   │   │   │           │   └── ProductServiceImpl.java
│   │   │   │           ├── utils/
│   │   │   │           │   ├── DeliveryChargeCalculator.java
│   │   │   │           │   └── FileUploadService.java
│   │   │   │           └── EasycartBackendApplication.java
│   │   │   └── resources/
│   │   │       ├── application.properties
│   │   │       └── schema.sql
│   │   └── test/
│   │       └── java/
│   │           └── EasyCart/
│   │               └── Backend/
│   │                   └── EasycartBackendApplicationTests.java
│   ├── uploads/
│   │   ├── 1b3b4a97-8010-4100-94c1-dd99f1a9e56c.jpeg
│   │   ├── iphone16pro.png
│   │   ├── iphone18duo.png
│   │   ├── lenovo-loq-rtx5050.png
│   │   ├── logo.png
│   │   ├── nike-airmax-red.png
│   │   ├── oneplus-nord-ce5.png
│   │   ├── samsung-s26-ultra.png
│   │   └── sony-headphones.png
│   ├── .gitattributes
│   ├── .gitignore
│   ├── HELP.md
│   ├── JDBC_SETUP.md
│   ├── mvnw
│   ├── mvnw.cmd
│   └── pom.xml
├── easycart-frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── iphone16pro.png
│   │   │   ├── lenovo-loq-rtx5050.png
│   │   │   ├── logo.png
│   │   │   ├── nike-airmax-red.png
│   │   │   ├── oneplus-nord-ce5.png
│   │   │   ├── react.svg
│   │   │   ├── samsung-s26-ultra.png
│   │   │   ├── sony-headphones.png
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   ├── Footer.jsx
│   │   │   ├── HeroSlider.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductMediaSlider.jsx
│   │   │   ├── ProductSkeletonGrid.jsx
│   │   │   └── RatingStars.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── ProductContext.jsx
│   │   │   ├── ThemeContext.jsx
│   │   │   ├── ToastContext.jsx
│   │   │   └── WishlistContext.jsx
│   │   ├── pages/
│   │   │   ├── AddProduct.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminOrders.jsx
│   │   │   ├── AdminProfile.jsx
│   │   │   ├── BrowsingHistory.jsx
│   │   │   ├── BuyerProfile.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Categories.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Customers.jsx
│   │   │   ├── EditProduct.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ManageProducts.jsx
│   │   │   ├── MyOrders.jsx
│   │   │   ├── OrderDetails.jsx
│   │   │   ├── OrderSuccess.jsx
│   │   │   ├── ProductDetails.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── SearchResults.jsx
│   │   │   ├── SellerDashboard.jsx
│   │   │   ├── SellerProfile.jsx
│   │   │   └── Wishlist.jsx
│   │   ├── router/
│   │   │   ├── AppRoutes.jsx
│   │   │   └── RequireRole.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.jsx
│   │   │   ├── cartService.js
│   │   │   ├── orderService.js
│   │   │   ├── pricing.js
│   │   │   ├── productService.js
│   │   │   └── resolveProductImage.js
│   │   ├── utils/
│   │   │   ├── deliveryCharge.js
│   │   │   └── productSearch.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   ├── main.jsx
│   │   └── SellerProfile.jsx
│   ├── .gitignore
│   ├── .oxlintrc.json
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── uploads/
│   ├── 244379f0-603a-4567-9af3-31dda2be9d29.png
│   ├── 6e919206-0688-49ea-aa46-d74fe74d1bcf.png
│   ├── bf691632-9afe-429b-ad5e-50af0ba30e83.png
│   ├── iphone16pro.png
│   ├── lenovo-loq-rtx5050.png
│   ├── logo.png
│   ├── nike-airmax-red.png
│   ├── oneplus-nord-ce5.png
│   ├── samsung-s26-ultra.png
│   └── sony-headphones.png
├── PROJECT_STRUCTURE.md
└── README.md
```

## Main areas

- `easycart-frontend/src/pages/` contains buyer, seller, and admin screens.
- `easycart-frontend/src/components/` contains reusable interface elements.
- `easycart-frontend/src/context/` holds shared authentication, cart, product, theme, toast, and wishlist state.
- `easycart-frontend/src/services/` contains API clients and frontend service helpers.
- `easycart-backend/src/main/java/EasyCart/Backend/controller/` exposes REST endpoints.
- `easycart-backend/src/main/java/EasyCart/Backend/service/` and `serviceImpl/` contain business logic.
- `easycart-backend/src/main/java/EasyCart/Backend/repository/` contains direct JDBC database access.
- `easycart-backend/src/main/java/EasyCart/Backend/entity/` contains application data models.
- `easycart-backend/src/main/resources/schema.sql` defines the MySQL tables created by the application.
- `easycart-backend/uploads/` and root `uploads/` contain uploaded or bundled media used during local development.
