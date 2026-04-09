-- SmartFood Database Schema (Full - MySQL 8.x Compatible)
-- Bao gồm Google OAuth + 2FA columns
-- Chạy file này để tạo toàn bộ database từ đầu

CREATE DATABASE IF NOT EXISTS smartfood CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE smartfood;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(150) UNIQUE NOT NULL,
  password      VARCHAR(255) NULL,          -- NULL cho Google OAuth users
  role          ENUM('user','store','driver','admin') DEFAULT 'user',
  phone         VARCHAR(20),
  lat           DECIMAL(10,8),
  lng           DECIMAL(11,8),
  is_online     BOOLEAN DEFAULT FALSE,
  -- Google OAuth
  google_id     VARCHAR(255) UNIQUE,
  image_url     VARCHAR(500),
  -- 2FA
  two_factor_enabled  BOOLEAN DEFAULT FALSE,
  two_factor_secret   VARCHAR(255),
  backup_codes        TEXT,                 -- JSON array hashed backup codes
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role  (role),
  INDEX idx_email (email),
  INDEX idx_google_id (google_id)
);

-- ============================================
-- STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stores (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  owner_id    INT NOT NULL,
  name        VARCHAR(255) NOT NULL,
  address     VARCHAR(500),
  phone       VARCHAR(20),
  lat         DECIMAL(10,8) NOT NULL,
  lng         DECIMAL(11,8) NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  opening_time TIME,
  closing_time TIME,
  description TEXT,
  image_url   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner  (owner_id),
  INDEX idx_active (is_active)
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  store_id      INT NOT NULL,
  name          VARCHAR(100) NOT NULL,
  description   TEXT,
  image_url     VARCHAR(500),
  display_order INT DEFAULT 0,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_store (store_id),
  UNIQUE KEY unique_category (store_id, name)
);

-- ============================================
-- FOODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS foods (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  category_id      INT NOT NULL,
  store_id         INT NOT NULL,
  name             VARCHAR(255) NOT NULL,
  description      TEXT,
  price            DECIMAL(10,2) NOT NULL,
  image_url        VARCHAR(500),
  is_available     BOOLEAN DEFAULT TRUE,
  is_featured      BOOLEAN DEFAULT FALSE,
  is_hot           BOOLEAN DEFAULT FALSE,
  preparation_time INT DEFAULT 15 COMMENT 'in minutes',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id)    REFERENCES stores(id)     ON DELETE CASCADE,
  INDEX idx_category  (category_id),
  INDEX idx_store     (store_id),
  INDEX idx_available (is_available)
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  user_id          INT NOT NULL,
  store_id         INT NOT NULL,
  driver_id        INT,
  status           ENUM(
                     'PENDING','CONFIRMED','FINDING_DRIVER',
                     'DRIVER_ACCEPTED','PICKING_UP','DELIVERING','COMPLETED','CANCELLED'
                   ) DEFAULT 'PENDING',
  delivery_lat     DECIMAL(10,8) NOT NULL,
  delivery_lng     DECIMAL(11,8) NOT NULL,
  delivery_address VARCHAR(500),
  total_food_price DECIMAL(10,2) NOT NULL,
  shipping_fee     DECIMAL(10,2) DEFAULT 0,
  total_price      DECIMAL(10,2) NOT NULL,
  distance_km      DECIMAL(10,2),
  notes            TEXT,
  payment_method   ENUM('CASH','CARD','WALLET') DEFAULT 'CASH',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at     TIMESTAMP NULL,
  FOREIGN KEY (user_id)   REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (store_id)  REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id)  ON DELETE SET NULL,
  INDEX idx_user    (user_id),
  INDEX idx_store   (store_id),
  INDEX idx_driver  (driver_id),
  INDEX idx_status  (status),
  INDEX idx_created (created_at)
);

-- ============================================
-- ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id       INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  food_id  INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price    DECIMAL(10,2) NOT NULL,
  notes    TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id)  REFERENCES foods(id)  ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_food  (food_id)
);

-- ============================================
-- DRIVER_LOCATION_HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS driver_location_history (
  id        INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  order_id  INT,
  lat       DECIMAL(10,8) NOT NULL,
  lng       DECIMAL(11,8) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (order_id)  REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_driver    (driver_id),
  INDEX idx_order     (order_id),
  INDEX idx_timestamp (timestamp)
);

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS ratings (
  id           INT PRIMARY KEY AUTO_INCREMENT,
  order_id     INT NOT NULL,
  user_id      INT NOT NULL,
  driver_id    INT,
  store_id     INT NOT NULL,
  rating_score INT CHECK (rating_score BETWEEN 1 AND 5),
  comment      TEXT,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id)  REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id)  ON DELETE SET NULL,
  FOREIGN KEY (store_id)  REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_order  (order_id),
  INDEX idx_user   (user_id),
  INDEX idx_driver (driver_id),
  INDEX idx_store  (store_id),
  UNIQUE KEY unique_order_rating (order_id, user_id)
);

-- ============================================
-- STORE REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS store_registrations (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  user_id          INT NOT NULL,
  store_name       VARCHAR(255) NOT NULL,
  store_address    VARCHAR(500),
  store_phone      VARCHAR(20),
  lat              DECIMAL(10,8) NOT NULL,
  lng              DECIMAL(11,8) NOT NULL,
  business_type    VARCHAR(100),
  store_image_url  VARCHAR(500),
  status           ENUM('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  rejection_reason TEXT,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user   (user_id),
  INDEX idx_status (status)
);

-- ============================================
-- PROMOTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS promotions (
  id                  INT PRIMARY KEY AUTO_INCREMENT,
  store_id            INT NOT NULL,
  code                VARCHAR(50) UNIQUE,
  discount_percentage DECIMAL(5,2),
  discount_amount     DECIMAL(10,2),
  max_uses            INT,
  used_count          INT DEFAULT 0,
  start_date          DATETIME,
  end_date            DATETIME,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_store  (store_id),
  INDEX idx_code   (code),
  INDEX idx_active (is_active)
);

-- Xác nhận
SELECT 'SmartFood database created successfully!' AS status;
SHOW TABLES;
