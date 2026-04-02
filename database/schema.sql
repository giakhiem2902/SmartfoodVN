-- SmartFood Database Schema
-- MySQL 5.7+ with Spatial Functions Support

CREATE DATABASE IF NOT EXISTS smartfood;
USE smartfood;

-- ============================================
-- USERS TABLE (Users, Drivers, Stores, Admins)
-- ============================================
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'store', 'driver', 'admin') DEFAULT 'user',
  phone VARCHAR(20),
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),
  is_online BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_email (email),
  SPATIAL INDEX spatial_idx (POINT(lng, lat))
);

-- ============================================
-- STORES TABLE
-- ============================================
CREATE TABLE stores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  owner_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  phone VARCHAR(20),
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  opening_time TIME,
  closing_time TIME,
  description TEXT,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id),
  INDEX idx_active (is_active),
  SPATIAL INDEX spatial_idx (POINT(lng, lat))
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  store_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(500),
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_store (store_id),
  UNIQUE KEY unique_category (store_id, name)
);

-- ============================================
-- FOODS TABLE
-- ============================================
CREATE TABLE foods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  category_id INT NOT NULL,
  store_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  preparation_time INT DEFAULT 15 COMMENT 'in minutes',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_category (category_id),
  INDEX idx_store (store_id),
  INDEX idx_available (is_available)
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  store_id INT NOT NULL,
  driver_id INT,
  status ENUM(
    'PENDING',
    'CONFIRMED',
    'FINDING_DRIVER',
    'DRIVER_ACCEPTED',
    'DELIVERING',
    'COMPLETED',
    'CANCELLED'
  ) DEFAULT 'PENDING',
  delivery_lat DECIMAL(10, 8) NOT NULL,
  delivery_lng DECIMAL(11, 8) NOT NULL,
  delivery_address VARCHAR(500),
  total_food_price DECIMAL(10, 2) NOT NULL,
  shipping_fee DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  distance_km DECIMAL(10, 2),
  notes TEXT,
  payment_method ENUM('CASH', 'CARD', 'WALLET') DEFAULT 'CASH',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_store (store_id),
  INDEX idx_driver (driver_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at),
  SPATIAL INDEX spatial_idx (POINT(delivery_lng, delivery_lat))
);

-- ============================================
-- ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  food_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE RESTRICT,
  INDEX idx_order (order_id),
  INDEX idx_food (food_id)
);

-- ============================================
-- DRIVER_LOCATION_HISTORY TABLE (for analytics)
-- ============================================
CREATE TABLE driver_location_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  driver_id INT NOT NULL,
  order_id INT,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
  INDEX idx_driver (driver_id),
  INDEX idx_order (order_id),
  INDEX idx_timestamp (timestamp),
  SPATIAL INDEX spatial_idx (POINT(lng, lat))
);

-- ============================================
-- RATINGS TABLE
-- ============================================
CREATE TABLE ratings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id INT NOT NULL,
  user_id INT NOT NULL,
  driver_id INT,
  store_id INT NOT NULL,
  rating_score INT CHECK (rating_score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_user (user_id),
  INDEX idx_driver (driver_id),
  INDEX idx_store (store_id),
  UNIQUE KEY unique_order_rating (order_id, user_id)
);

-- ============================================
-- PROMOTION TABLE
-- ============================================
CREATE TABLE promotions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  store_id INT NOT NULL,
  code VARCHAR(50) UNIQUE,
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  max_uses INT,
  used_count INT DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
  INDEX idx_store (store_id),
  INDEX idx_code (code),
  INDEX idx_active (is_active)
);

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Find stores within radius
DELIMITER //
CREATE PROCEDURE FindStoresNearby(
  IN user_lat DECIMAL(10, 8),
  IN user_lng DECIMAL(11, 8),
  IN radius_km INT
)
BEGIN
  SELECT 
    s.id,
    s.name,
    s.address,
    s.lat,
    s.lng,
    s.image_url,
    (ST_Distance_Sphere(POINT(s.lng, s.lat), POINT(user_lng, user_lat)) / 1000) AS distance_km
  FROM stores s
  WHERE s.is_active = TRUE
  AND ST_Distance_Sphere(POINT(s.lng, s.lat), POINT(user_lng, user_lat)) / 1000 <= radius_km
  ORDER BY distance_km ASC;
END//
DELIMITER ;

-- Find available drivers near store
DELIMITER //
CREATE PROCEDURE FindDriversNearStore(
  IN store_lat DECIMAL(10, 8),
  IN store_lng DECIMAL(11, 8),
  IN max_distance_km INT
)
BEGIN
  SELECT 
    u.id,
    u.username,
    u.phone,
    u.lat,
    u.lng,
    (ST_Distance_Sphere(POINT(u.lng, u.lat), POINT(store_lng, store_lat)) / 1000) AS distance_km
  FROM users u
  WHERE u.role = 'driver'
  AND u.is_online = TRUE
  AND ST_Distance_Sphere(POINT(u.lng, u.lat), POINT(store_lng, store_lat)) / 1000 <= max_distance_km
  ORDER BY distance_km ASC;
END//
DELIMITER ;

-- Get daily revenue
DELIMITER //
CREATE PROCEDURE GetDailyRevenue(
  IN store_id INT,
  IN date_str DATE
)
BEGIN
  SELECT 
    DATE(o.created_at) as order_date,
    COUNT(o.id) as total_orders,
    SUM(o.total_food_price) as total_food_price,
    SUM(o.shipping_fee) as total_shipping_fee,
    SUM(o.total_price) as total_revenue
  FROM orders o
  WHERE o.store_id = store_id
  AND DATE(o.created_at) = date_str
  AND o.status = 'COMPLETED'
  GROUP BY DATE(o.created_at);
END//
DELIMITER ;
