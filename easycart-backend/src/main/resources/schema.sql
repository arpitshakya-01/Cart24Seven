CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(254) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(16) NOT NULL DEFAULT 'BUYER',
  phone VARCHAR(255) NULL,
  address_line VARCHAR(500) NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(255) NULL,
  pincode VARCHAR(255) NULL,
  payment_preference VARCHAR(255) NULL,
  gstin VARCHAR(15) NULL,
  gstin_status VARCHAR(24) NOT NULL DEFAULT 'NOT_SUBMITTED',
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  category_name VARCHAR(255) NOT NULL,
  description VARCHAR(255) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_categories_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT NOT NULL AUTO_INCREMENT,
  product_name VARCHAR(255) NOT NULL,
  brand VARCHAR(255) NULL,
  description VARCHAR(1000) NULL,
  image_url VARCHAR(2048) NULL,
  price DOUBLE NULL,
  base_price DOUBLE NULL,
  gst_rate DOUBLE NULL DEFAULT 18,
  hsn_code VARCHAR(20) NULL,
  hsn_verified BIT(1) NOT NULL DEFAULT b'0',
  mrp DOUBLE NULL,
  cost_price DOUBLE NULL,
  operating_cost DOUBLE NULL,
  platform_fee_percent DOUBLE NULL,
  profit_margin_percent DOUBLE NULL,
  rating DOUBLE NULL,
  stock INT NULL,
  discount INT NULL,
  seller_email VARCHAR(255) NULL,
  category_id BIGINT NULL,
  PRIMARY KEY (id),
  KEY idx_products_category (category_id),
  KEY idx_products_seller (seller_email),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_media (
  id BIGINT NOT NULL AUTO_INCREMENT, product_id BIGINT NOT NULL, media_url VARCHAR(2048) NOT NULL,
  media_type VARCHAR(16) NOT NULL DEFAULT 'IMAGE', sort_order INT NOT NULL DEFAULT 0, PRIMARY KEY(id),
  KEY idx_product_media_product(product_id),
  CONSTRAINT fk_product_media_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGINT NOT NULL AUTO_INCREMENT, product_id BIGINT NOT NULL, order_id BIGINT NOT NULL, buyer_email VARCHAR(255) NOT NULL, buyer_name VARCHAR(120) NULL,
  rating INT NOT NULL, comment VARCHAR(1000) NULL, created_at DATETIME(6) NOT NULL, PRIMARY KEY(id), UNIQUE KEY uk_product_review_order(order_id), KEY idx_product_reviews_product(product_id),
  CONSTRAINT fk_product_review_product FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS order_reviews (
  id BIGINT NOT NULL AUTO_INCREMENT, order_id BIGINT NOT NULL, buyer_email VARCHAR(255) NOT NULL, rating INT NOT NULL, comment VARCHAR(1000) NULL, delivery_feedback VARCHAR(32) NULL, created_at DATETIME(6) NOT NULL, PRIMARY KEY(id), UNIQUE KEY uk_order_review_order(order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS carts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  buyer_email VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_carts_buyer_email (buyer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  cart_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_items_cart_product (cart_id, product_id),
  KEY idx_cart_items_product (product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT NOT NULL AUTO_INCREMENT,
  customer_name VARCHAR(255) NULL,
  phone VARCHAR(255) NULL,
  address VARCHAR(500) NULL,
  city VARCHAR(255) NULL,
  state VARCHAR(255) NULL,
  pincode VARCHAR(255) NULL,
  product_name VARCHAR(255) NULL,
  product_image VARCHAR(2048) NULL,
  product_price DOUBLE NULL,
  product_cost_price DOUBLE NULL,
  product_operating_cost DOUBLE NULL,
  product_platform_fee_percent DOUBLE NULL,
  quantity INT NULL,
  subtotal DOUBLE NULL,
  gst DOUBLE NULL,
  taxable_value DOUBLE NULL,
  gst_rate DOUBLE NULL,
  cgst DOUBLE NULL,
  sgst DOUBLE NULL,
  igst DOUBLE NULL,
  hsn_code VARCHAR(20) NULL,
  seller_state VARCHAR(255) NULL,
  seller_gstin VARCHAR(15) NULL,
  marketplace_commission DOUBLE NULL,
  commission_gst DOUBLE NULL,
  tcs DOUBLE NULL,
  tcs_cgst DOUBLE NULL,
  tcs_sgst DOUBLE NULL,
  tcs_igst DOUBLE NULL,
  net_seller_payout DOUBLE NULL,
  delivery_charge DOUBLE NULL,
  total_amount DOUBLE NULL,
  order_status VARCHAR(255) NULL,
  order_date DATETIME(6) NULL,
  buyer_email VARCHAR(255) NULL,
  seller_email VARCHAR(255) NULL,
  product_id BIGINT NULL,
  payment_method VARCHAR(255) NULL,
  payment_status VARCHAR(255) NULL,
  payment_reference VARCHAR(255) NULL,
  PRIMARY KEY (id),
  KEY idx_orders_buyer (buyer_email),
  KEY idx_orders_seller (seller_email),
  KEY idx_orders_date (order_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS payment_attempts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  razorpay_order_id VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  amount_paise BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  order_snapshot LONGTEXT NOT NULL,
  payment_id VARCHAR(255) NULL,
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_payment_attempt_razorpay_order (razorpay_order_id),
  KEY idx_payment_attempt_buyer (buyer_email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
