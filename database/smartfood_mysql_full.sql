-- SmartFood Database - Full MySQL Schema
-- Database: smartfood
-- Created: April 2026
-- Version: 1.0

-- Drop existing database if exists
DROP DATABASE IF EXISTS `smartfood`;

-- Create database
CREATE DATABASE `smartfood` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE `smartfood`;

-- ========================================
-- Table: users
-- ========================================
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL UNIQUE,
  `email` varchar(150) NOT NULL UNIQUE,
  `password` varchar(255) DEFAULT NULL,
  `role` enum('user','store','driver','admin') DEFAULT 'user',
  `phone` varchar(20) DEFAULT NULL,
  `lat` decimal(10,8) DEFAULT NULL,
  `lng` decimal(11,8) DEFAULT NULL,
  `is_online` tinyint(1) DEFAULT '0',
  `google_id` varchar(255) UNIQUE DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT '0',
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `backup_codes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_role` (`role`),
  KEY `idx_email` (`email`),
  KEY `idx_google_id` (`google_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: stores
-- ========================================
CREATE TABLE `stores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `owner_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `lat` decimal(10,8) NOT NULL,
  `lng` decimal(11,8) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner` (`owner_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `stores_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: categories
-- ========================================
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `display_order` int DEFAULT '0',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_category` (`store_id`,`name`),
  KEY `idx_store` (`store_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: foods
-- ========================================
CREATE TABLE `foods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL,
  `store_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_available` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `is_hot` tinyint(1) DEFAULT '0',
  `preparation_time` int DEFAULT '15' COMMENT 'in minutes',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category_id`),
  KEY `idx_store` (`store_id`),
  KEY `idx_available` (`is_available`),
  CONSTRAINT `foods_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE,
  CONSTRAINT `foods_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: orders
-- ========================================
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `store_id` int NOT NULL,
  `driver_id` int DEFAULT NULL,
  `status` enum('PENDING','CONFIRMED','FINDING_DRIVER','DRIVER_ACCEPTED','PICKING_UP','DELIVERING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `delivery_lat` decimal(10,8) NOT NULL,
  `delivery_lng` decimal(11,8) NOT NULL,
  `delivery_address` varchar(500) DEFAULT NULL,
  `total_food_price` decimal(10,2) NOT NULL,
  `shipping_fee` decimal(10,2) DEFAULT '0.00',
  `total_price` decimal(10,2) NOT NULL,
  `distance_km` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `payment_method` enum('CASH','CARD','WALLET') DEFAULT 'CASH',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_store` (`store_id`),
  KEY `idx_driver` (`driver_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created` (`created_at`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: order_items
-- ========================================
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `food_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(10,2) NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_food` (`food_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`food_id`) REFERENCES `foods` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: ratings
-- ========================================
CREATE TABLE `ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `user_id` int NOT NULL,
  `driver_id` int DEFAULT NULL,
  `store_id` int NOT NULL,
  `rating_score` int DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_rating` (`order_id`,`user_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_driver` (`driver_id`),
  KEY `idx_store` (`store_id`),
  CONSTRAINT `ratings_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ratings_ibfk_3` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ratings_ibfk_4` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: driver_location_history
-- ========================================
CREATE TABLE `driver_location_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `driver_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `lat` decimal(10,8) NOT NULL,
  `lng` decimal(11,8) NOT NULL,
  `timestamp` timestamp DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_driver` (`driver_id`),
  KEY `idx_order` (`order_id`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `driver_location_history_ibfk_1` FOREIGN KEY (`driver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `driver_location_history_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: promotions
-- ========================================
CREATE TABLE `promotions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `store_id` int NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `discount_percentage` decimal(5,2) DEFAULT NULL,
  `discount_amount` decimal(10,2) DEFAULT NULL,
  `max_uses` int DEFAULT NULL,
  `used_count` int DEFAULT '0',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_store` (`store_id`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `promotions_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- Table: store_registrations
-- ========================================
CREATE TABLE `store_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `store_name` varchar(255) NOT NULL,
  `store_address` varchar(500) DEFAULT NULL,
  `store_phone` varchar(20) DEFAULT NULL,
  `lat` decimal(10,8) NOT NULL,
  `lng` decimal(11,8) NOT NULL,
  `business_type` varchar(100) DEFAULT NULL,
  `store_image_url` varchar(500) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') DEFAULT 'PENDING',
  `rejection_reason` text DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `store_registrations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- INSERT DATA
-- ========================================

-- Insert Users
INSERT INTO `users` (`id`, `username`, `email`, `password`, `role`, `phone`, `lat`, `lng`, `is_online`, `google_id`, `image_url`, `two_factor_enabled`, `two_factor_secret`, `backup_codes`, `created_at`, `updated_at`) VALUES
(1, 'Lê Trần Gia Khiêm', 'giakhiemltgk2902@gmail.com', NULL, 'user', NULL, 10.83561443, 106.67623285, 0, '105004531013213621688', 'https://lh3.googleusercontent.com/a/ACg8ocJQ5fO9CX1_y6GlW6jzYxsdbO_DMOTchrI0h3lrI6hHP0AfUQ=s96-c', 0, NULL, NULL, '2026-04-01 07:48:13', '2026-04-09 15:28:35'),
(2, 'admin', 'admin@smartfood.com', '$2a$10$J5H5m2CFA9.EYWa9QxHpAOnrl1uIjdtJGoEsVVOOoSt74LN/I3ni2', 'admin', '0900000001', NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, '2026-04-01 07:59:45', '2026-04-01 07:59:45'),
(3, 'driver01', 'driver@smartfood.com', '$2a$10$BdUOQ/TbJviBRIdRleuF..35w3Tij3r1HYNuAPFD0FxguW3bByBJ.', 'driver', '0900000002', 10.79303510, 106.71158450, 1, NULL, NULL, 0, NULL, NULL, '2026-04-01 07:59:45', '2026-04-09 15:46:54'),
(4, 'store01', 'store@smartfood.com', '$2a$10$wMVqVvABaIMu0ulpf.qgJOk4tLLsYCKwAth/8hLyPURpe0y0JlCZK', 'store', '0900000003', NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, '2026-04-01 07:59:45', '2026-04-09 14:15:13'),
(10, 'quan_an_binhduong', 'owner1@smartfood.com', '$2a$10$wMVqVvABaIMu0ulpf.qgJOk4tLLsYCKwAth/8hLyPURpe0y0JlCZK', 'store', '0909111001', NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, '2026-04-01 08:04:30', '2026-04-09 14:15:13'),
(11, 'com_tam_thu_duc', 'owner2@smartfood.com', '$2a$10$wMVqVvABaIMu0ulpf.qgJOk4tLLsYCKwAth/8hLyPURpe0y0JlCZK', 'store', '0909111002', NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, '2026-04-01 08:04:30', '2026-04-09 14:15:13'),
(12, 'bun_bo_hue_123', 'owner3@smartfood.com', '$2a$10$wMVqVvABaIMu0ulpf.qgJOk4tLLsYCKwAth/8hLyPURpe0y0JlCZK', 'store', '0909111003', NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, '2026-04-01 08:04:30', '2026-04-09 14:15:13'),
(13, 'pho_suong_thu_duc', 'owner4@smartfood.com', '$2a$10$wMVqVvABaIMu0ulpf.qgJOk4tLLsYCKwAth/8hLyPURpe0y0JlCZK', 'store', '0909111004', NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, '2026-04-01 08:04:30', '2026-04-09 14:15:13'),
(14, 'mi_quang_da_nang', 'owner5@smartfood.com', '$2a$10$wMVqVvABaIMu0ulpf.qgJOk4tLLsYCKwAth/8hLyPURpe0y0JlCZK', 'store', '0909111005', NULL, NULL, 0, NULL, NULL, 0, NULL, NULL, '2026-04-01 08:04:30', '2026-04-09 14:15:13');

-- Insert Stores
INSERT INTO `stores` (`id`, `owner_id`, `name`, `address`, `phone`, `lat`, `lng`, `is_active`, `opening_time`, `closing_time`, `description`, `image_url`, `created_at`, `updated_at`) VALUES
(6, 10, 'Quán Cơm Bình Dân Số 1', '12 Đường Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP.HCM', '0909111001', 10.85060000, 106.77420000, 1, '06:00:00', '21:00:00', 'Quán cơm bình dân ngon, giá rẻ, phục vụ nhanh gần Đại học Bách Khoa', '/uploads/stores/com-binh-dan.jpg', '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(7, 11, 'Cơm Tấm Thuý - Thủ Đức', '45 Đường Lê Văn Việt, Phường Hiệp Phú, TP. Thủ Đức, TP.HCM', '0909111002', 10.84790000, 106.78350000, 1, '05:30:00', '14:00:00', 'Cơm tấm sườn bì chả nổi tiếng, mở cửa sớm, đông khách buổi sáng', '/uploads/stores/com-tam.jpg', '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(8, 12, 'Bún Bò Huế Mệ Tám', '78 Đường Đặng Văn Bi, Phường Bình Thọ, TP. Thủ Đức, TP.HCM', '0909111003', 10.85320000, 106.76890000, 1, '06:00:00', '11:30:00', 'Bún bò Huế chuẩn vị miền Trung, nước lèo đậm đà, thịt heo giò hầm mềm', '/uploads/stores/bun-bo-hue-me-tam.jpg', '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(9, 13, 'Phở Sướng - Thủ Đức', '201 Đường Hoàng Diệu 2, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM', '0909111004', 10.87150000, 106.75640000, 1, '05:00:00', '12:00:00', 'Phở bò Nam Định chuẩn vị, bánh phở dai, nước dùng hầm xương 12 tiếng', '/uploads/stores/pho-suong.jpg', '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(10, 14, 'Mì Quảng Đà Nẵng Chính Gốc', '33 Đường Kha Vạn Cân, Phường Linh Đông, TP. Thủ Đức, TP.HCM', '0909111005', 10.86420000, 106.76120000, 1, '07:00:00', '20:00:00', 'Mì Quảng chuẩn Đà Nẵng, tôm thịt đầy đặn, bánh tráng mè giòn rụm', '/uploads/stores/mi-quang-da-nang.jpg', '2026-04-01 08:04:30', '2026-04-01 08:49:25');

-- Insert Categories
INSERT INTO `categories` (`id`, `store_id`, `name`, `description`, `image_url`, `display_order`, `created_at`, `updated_at`) VALUES
(17, 6, 'Cơm dĩa', 'Các loại cơm phần đầy đặn', '/uploads/categories/com-dia.jpg', 1, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(18, 6, 'Món kho', 'Thịt kho, cá kho, tép kho', '/uploads/categories/mon-kho.jpg', 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(19, 6, 'Canh & súp', 'Canh chua, canh khổ qua, súp...', '/uploads/categories/canh-sup.jpg', 3, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(20, 6, 'Nước uống', 'Trà đá, nước ngọt, sinh tố', '/uploads/categories/nuoc-uong.jpg', 4, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(21, 7, 'Cơm tấm sườn', 'Cơm tấm sườn bì chả các loại', '/uploads/categories/com-tam-suon.jpg', 1, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(22, 7, 'Bì chả', 'Bì, chả trứng, chả thịt', '/uploads/categories/bi-cha.jpg', 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(23, 7, 'Nước uống', 'Cà phê sữa đá, trà đá', '/uploads/categories/nuoc-uong.jpg', 3, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(24, 8, 'Bún bò Huế', 'Bún bò, bún giò, bún hỗn hợp', '/uploads/categories/bun-bo-hue.jpg', 1, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(25, 8, 'Ăn kèm', 'Rau sống, chả Huế, huyết', '/uploads/categories/rau.jpg', 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(26, 8, 'Nước uống', 'Nước sâm, trà đá', '/uploads/categories/nuoc-uong.jpg', 3, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(27, 9, 'Phở bò', 'Phở tái, chín, nạm, gầu...', '/uploads/categories/pho-bo.jpg', 1, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(28, 9, 'Phở gà', 'Phở gà ta, gà công nghiệp', '/uploads/categories/pho-ga.jpg', 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(29, 9, 'Ăn kèm', 'Quẩy, trứng, thịt thêm', '/uploads/categories/quay.jpg', 3, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(30, 10, 'Mì Quảng', 'Mì Quảng tôm thịt, gà, chay', '/uploads/categories/mi-quang.jpg', 1, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(31, 10, 'Cao lầu', 'Cao lầu Hội An đặc biệt', '/uploads/categories/cao-lau.jpg', 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(32, 10, 'Nước uống', 'Chè, nước sâm Hội An', '/uploads/categories/che.jpg', 3, '2026-04-01 08:04:30', '2026-04-01 08:49:25');

-- Insert Foods
INSERT INTO `foods` (`id`, `category_id`, `store_id`, `name`, `description`, `price`, `image_url`, `is_available`, `is_featured`, `is_hot`, `preparation_time`, `created_at`, `updated_at`) VALUES
(43, 17, 6, 'Cơm sườn nướng', 'Cơm trắng + sườn nướng than hoa + canh + rau', 35000.00, '/uploads/foods/com-suon-nuong.jpg', 1, 1, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(44, 17, 6, 'Cơm gà chiên nước mắm', 'Cơm trắng + đùi gà chiên nước mắm + dưa leo', 38000.00, '/uploads/foods/com-ga-nuoc-mam.jpg', 1, 0, 0, 12, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(45, 17, 6, 'Cơm thịt kho trứng', 'Cơm trắng + thịt ba chỉ kho trứng + canh chua', 32000.00, '/uploads/foods/com-thit-kho-trung.jpg', 1, 0, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(46, 17, 6, 'Cơm chay đặc biệt', 'Cơm trắng + đậu hũ + rau củ xào + canh', 28000.00, '/uploads/foods/com-chay.jpg', 1, 0, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(47, 18, 6, 'Cá basa kho tộ', 'Cá basa kho sả ớt, nước kho đậm đà', 25000.00, '/uploads/foods/ca-basa-kho-to.jpg', 1, 0, 0, 15, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(48, 18, 6, 'Thịt ba chỉ kho tiêu', 'Thịt ba chỉ kho tiêu đậm, ăn kèm cơm trắng', 22000.00, '/uploads/foods/thit-ba-chi-kho.jpg', 1, 0, 0, 15, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(49, 19, 6, 'Canh chua cá lóc', 'Canh chua nấu với cá lóc, cà chua, dứa, giá', 20000.00, '/uploads/foods/canh-chua-ca-loc.jpg', 1, 0, 0, 15, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(50, 19, 6, 'Canh khổ qua nhồi thịt', 'Khổ qua nhồi thịt heo xay, nước dùng ngọt thanh', 22000.00, '/uploads/foods/canh-kho-qua.jpg', 1, 0, 0, 20, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(51, 20, 6, 'Trà đá', 'Trà đá miễn phí khi mua cơm', 0.00, '/uploads/foods/tra-da.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(52, 20, 6, 'Nước ngọt lon', 'Pepsi, 7Up, Mirinda (1 lon)', 12000.00, '/uploads/foods/nuoc-ngot-lon.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(53, 21, 7, 'Cơm tấm sườn bì chả', 'Phần đầy đủ: sườn nướng + bì + chả trứng + mỡ hành + đồ chua', 45000.00, '/uploads/foods/com-suon-bi-cha.jpg', 1, 1, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(54, 21, 7, 'Cơm tấm sườn đặc biệt', 'Sườn cốt lết nướng lớn + trứng ốp la + bì + chả', 55000.00, '/uploads/foods/com-suon-dac-biet.jpg', 1, 1, 0, 12, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(55, 21, 7, 'Cơm tấm sườn nướng', 'Chỉ sườn nướng + cơm tấm, không kèm bì chả', 38000.00, '/uploads/foods/com-suon-nuong.jpg', 1, 0, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(56, 21, 7, 'Cơm tấm gà nướng', 'Đùi gà nướng lửa than + cơm tấm + đồ chua', 42000.00, '/uploads/foods/com-tam-ga.jpg', 1, 0, 0, 15, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(57, 22, 7, 'Chả trứng hấp', 'Chả thịt heo + trứng hấp kiểu Sài Gòn', 15000.00, '/uploads/foods/cha-trung-hap.jpg', 1, 0, 0, 5, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(58, 22, 7, 'Bì heo trộn', 'Bì heo thái sợi trộn thính, thơm ngon', 12000.00, '/uploads/foods/bi-heo-tron.jpg', 1, 0, 0, 5, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(59, 23, 7, 'Cà phê sữa đá', 'Cà phê phin truyền thống + sữa đặc + đá', 18000.00, '/uploads/foods/ca-phe-sua-da.jpg', 1, 0, 0, 5, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(60, 23, 7, 'Trà đá', 'Trà đá miễn phí khi mua cơm tấm', 0.00, '/uploads/foods/tra-da.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(61, 24, 8, 'Bún bò Huế đặc biệt', 'Tô lớn đầy đủ: bò, giò heo, huyết, chả Huế, nước lèo đậm', 55000.00, '/uploads/foods/bun-bo-dac-biet.jpg', 1, 1, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(62, 24, 8, 'Bún bò thường', 'Tô bún bò cơ bản: thịt bò + nước lèo cay thơm', 40000.00, '/uploads/foods/bun-bo-thuong.jpg', 1, 0, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(63, 24, 8, 'Bún giò heo', 'Tô bún với giò heo hầm mềm rục, đậm vị', 50000.00, '/uploads/foods/bun-gio-heo.jpg', 1, 0, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(64, 24, 8, 'Bún hỗn hợp', 'Bò + giò + huyết + chả Huế trong 1 tô', 60000.00, '/uploads/foods/bun-bo-hon-hop.jpg', 1, 1, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(65, 25, 8, 'Chả Huế', 'Chả lụa Huế thơm ngon, ăn kèm bún bò', 10000.00, '/uploads/foods/cha-hue.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(66, 25, 8, 'Huyết heo', 'Huyết heo cắt miếng, thêm vào tô bún', 8000.00, '/uploads/foods/huyet-heo.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(67, 26, 8, 'Nước sâm đá', 'Nước sâm mát lạnh, giải nhiệt sau tô bún cay', 15000.00, '/uploads/foods/nuoc-sam-da.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(68, 26, 8, 'Trà đá', 'Trà đá free khi mua bún bò', 0.00, '/uploads/foods/tra-da.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(69, 27, 9, 'Phở bò tái chín', 'Tô phở bò tái + chín, nước dùng hầm xương 12 tiếng', 55000.00, '/uploads/foods/com-suon-bi-cha.jpg', 1, 1, 0, 8, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(70, 27, 9, 'Phở bò tái lăn', 'Thịt bò tái lăn qua nước dùng sôi, mềm vừa', 58000.00, '/uploads/foods/com-suon-nuong.jpg', 1, 0, 0, 8, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(71, 27, 9, 'Phở bò gầu béo', 'Tô phở với gầu bò béo ngậy, đậm đà', 60000.00, '/uploads/foods/bun-bo-dac-biet.jpg', 1, 1, 0, 8, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(72, 27, 9, 'Phở bò đặc biệt', 'Tái + chín + gầu + nạm trong 1 tô lớn', 75000.00, '/uploads/foods/bun-bo-hon-hop.jpg', 1, 0, 0, 10, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(73, 28, 9, 'Phở gà ta', 'Tô phở gà ta chặt miếng, nước trong ngọt', 50000.00, '/uploads/foods/com-ga-nuoc-mam.jpg', 1, 0, 0, 8, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(74, 28, 9, 'Phở gà xé', 'Gà xé sợi, ăn kèm gừng và hành phi', 48000.00, '/uploads/foods/com-thit-kho-trung.jpg', 1, 0, 0, 8, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(75, 29, 9, 'Quẩy', '2 cái quẩy giòn, chấm cùng nước phở', 8000.00, '/uploads/foods/nuoc-ngot-lon.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(76, 29, 9, 'Thịt bò thêm', 'Thêm 50g thịt bò vào tô phở', 20000.00, '/uploads/foods/thit-ba-chi-kho.jpg', 1, 0, 0, 2, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(77, 30, 10, 'Mì Quảng tôm thịt', 'Mì sợi vàng + tôm sú + thịt heo + trứng cút + bánh tráng mè', 50000.00, '/uploads/foods/com-suon-bi-cha.jpg', 1, 1, 0, 12, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(78, 30, 10, 'Mì Quảng gà', 'Mì Quảng thịt gà ta xé, nước nhân thơm nghệ', 48000.00, '/uploads/foods/com-ga-nuoc-mam.jpg', 1, 0, 0, 12, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(79, 30, 10, 'Mì Quảng ếch', 'Mì Quảng ếch đồng đặc sản, đậm vị miền Trung', 58000.00, '/uploads/foods/canh-chua-ca-loc.jpg', 1, 1, 0, 15, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(80, 30, 10, 'Mì Quảng chay', 'Mì Quảng chay với đậu hũ, nấm, rau củ', 38000.00, '/uploads/foods/com-chay.jpg', 1, 0, 0, 12, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(81, 31, 10, 'Cao lầu Hội An', 'Mì cao lầu + thịt xá xíu + tôm + rau sống + bánh tráng', 55000.00, '/uploads/foods/cao-lau.jpg', 1, 1, 0, 15, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(82, 31, 10, 'Cao lầu đặc biệt', 'Cao lầu thêm tôm và xá xíu, phần lớn hơn', 65000.00, '/uploads/foods/bun-bo-dac-biet.jpg', 1, 0, 0, 15, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(83, 32, 10, 'Chè đậu xanh', 'Chè đậu xanh nước dừa mát lạnh', 18000.00, '/uploads/foods/ca-phe-sua-da.jpg', 1, 0, 0, 5, '2026-04-01 08:04:30', '2026-04-01 08:49:25'),
(84, 32, 10, 'Nước sâm Hội An', 'Nước sâm đặc trưng Hội An, thanh mát giải nhiệt', 20000.00, '/uploads/foods/nuoc-sam-da.jpg', 1, 0, 0, 3, '2026-04-01 08:04:30', '2026-04-01 08:49:25');

-- Insert Orders
INSERT INTO `orders` (`id`, `user_id`, `store_id`, `driver_id`, `status`, `delivery_lat`, `delivery_lng`, `delivery_address`, `total_food_price`, `shipping_fee`, `total_price`, `distance_km`, `notes`, `payment_method`, `created_at`, `updated_at`, `completed_at`) VALUES
(1, 1, 7, 3, 'COMPLETED', 10.83563549, 106.67689770, 'Hẻm 212 Nguyễn Oanh, Phường Gò Vấp, Thuận An', 110000.00, 180000.00, 290000.00, 11.74, 'fdfsdfs', 'CASH', '2026-04-06 14:52:57', '2026-04-07 17:36:46', '2026-04-07 17:36:46'),
(2, 1, 8, 3, 'COMPLETED', 10.82901807, 106.67002937, 'Hẻm 379 Quang Trung, Phường Gò Vấp, Thuận An', 80000.00, 165000.00, 245000.00, 11.14, 'fsdfsd', 'CASH', '2026-04-06 14:56:57', '2026-04-08 08:12:48', '2026-04-08 08:12:48'),
(3, 1, 8, 3, 'COMPLETED', 10.83559338, 106.67668323, 'Hẻm 212 Nguyễn Oanh, Phường Gò Vấp, Thành phố Hồ Chí Minh', 50000.00, 150000.00, 200000.00, 10.27, 'đaa', 'CASH', '2026-04-06 15:08:13', '2026-04-09 14:36:41', '2026-04-09 14:36:41'),
(4, 1, 7, 3, 'DRIVER_ACCEPTED', 10.83565654, 106.67670468, 'Hẻm 212 Nguyễn Oanh, Phường Gò Vấp, Thuận An', 110000.00, 180000.00, 290000.00, 11.76, 'dsfsd', 'CASH', '2026-04-06 15:47:17', '2026-04-09 15:44:14', NULL),
(5, 1, 7, NULL, 'FINDING_DRIVER', 10.84001468, 106.67363776, 'Hẻm 226/24 Nguyễn Văn Lượng, Phường Gò Vấp, Thành phố Hồ Chí Minh', 36000.00, 180000.00, 216000.00, 12.04, 'daaa', 'CASH', '2026-04-06 15:51:23', '2026-04-07 16:56:02', NULL),
(6, 1, 6, NULL, 'FINDING_DRIVER', 10.82136625, 106.68466588, '10.8214, 106.6847', 44000.00, 150000.00, 194000.00, 10.32, 'dfgdfgd', 'CASH', '2026-04-08 08:01:47', '2026-04-09 14:25:22', NULL),
(7, 1, 7, NULL, 'PENDING', 10.82021244, 106.69043088, '10.8202, 106.6904', 90000.00, 165000.00, 255000.00, 10.63, 'dsfsdf', 'CASH', '2026-04-08 08:09:56', '2026-04-08 08:09:56', NULL),
(8, 1, 9, 3, 'COMPLETED', 10.81421657, 106.69724336, 'Hẻm 179 Nơ Trang Long, Phường Bình Thạnh, Thành phố Thủ Đức', 150000.00, 135000.00, 285000.00, 9.08, 'ghfhg', 'CASH', '2026-04-09 14:40:37', '2026-04-09 14:43:07', '2026-04-09 14:43:07'),
(9, 1, 6, NULL, 'PENDING', 10.84274560, 106.67108529, 'Hẻm 467/79 Lê Đức Thọ, Phường An Hội Đông, Thành phố Hồ Chí Minh', 56000.00, 165000.00, 221000.00, 11.31, 'fgdfg', 'CASH', '2026-04-09 15:33:48', '2026-04-09 15:33:48', NULL);

-- Insert Order Items
INSERT INTO `order_items` (`id`, `order_id`, `food_id`, `quantity`, `price`, `notes`, `created_at`) VALUES
(1, 1, 54, 2, 55000.00, NULL, '2026-04-06 14:52:57'),
(2, 2, 62, 2, 40000.00, NULL, '2026-04-06 14:56:57'),
(3, 3, 63, 1, 50000.00, NULL, '2026-04-06 15:08:13'),
(4, 4, 54, 2, 55000.00, NULL, '2026-04-06 15:47:17'),
(5, 5, 59, 2, 18000.00, NULL, '2026-04-06 15:51:23'),
(6, 6, 48, 2, 22000.00, NULL, '2026-04-08 08:01:47'),
(7, 7, 53, 2, 45000.00, NULL, '2026-04-08 08:09:56'),
(8, 8, 72, 2, 75000.00, NULL, '2026-04-09 14:40:37'),
(9, 9, 46, 2, 28000.00, NULL, '2026-04-09 15:33:48');

-- Insert Driver Location History
INSERT INTO `driver_location_history` (`id`, `driver_id`, `order_id`, `lat`, `lng`, `timestamp`) VALUES
(1, 3, 2, 10.85505680, 106.78540830, '2026-04-08 07:02:05'),
(2, 3, 2, 10.85510630, 106.78549020, '2026-04-08 07:55:59'),
(3, 3, 2, 10.85516020, 106.78556010, '2026-04-08 07:57:57'),
(4, 3, 2, 10.85507540, 106.78553780, '2026-04-08 07:58:51'),
(5, 3, 2, 10.85513730, 106.78555680, '2026-04-08 08:12:42'),
(6, 3, 3, 10.79304680, 106.71156420, '2026-04-09 14:36:17'),
(7, 3, 8, 10.79304190, 106.71159840, '2026-04-09 14:42:12'),
(8, 3, 4, 10.79304340, 106.71158520, '2026-04-09 15:44:25'),
(9, 3, 4, 10.79303510, 106.71158450, '2026-04-09 15:46:54');

-- ========================================
-- Commit Transaction
-- ========================================
COMMIT;
