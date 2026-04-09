-- SmartFood Database Migration for Google OAuth and 2FA
-- Run this after the initial schema.sql

-- Thêm các cột mới (bỏ qua nếu đã tồn tại)
SET @db = 'smartfood';

-- google_id
SET @col = 'google_id';
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='users' AND COLUMN_NAME=@col),
  'ALTER TABLE users ADD COLUMN google_id VARCHAR(255) UNIQUE AFTER is_online',
  'SELECT "google_id already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- image_url
SET @col = 'image_url';
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='users' AND COLUMN_NAME=@col),
  'ALTER TABLE users ADD COLUMN image_url VARCHAR(500) AFTER google_id',
  'SELECT "image_url already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- two_factor_enabled
SET @col = 'two_factor_enabled';
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='users' AND COLUMN_NAME=@col),
  'ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE AFTER image_url',
  'SELECT "two_factor_enabled already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- two_factor_secret
SET @col = 'two_factor_secret';
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='users' AND COLUMN_NAME=@col),
  'ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) AFTER two_factor_enabled',
  'SELECT "two_factor_secret already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- backup_codes
SET @col = 'backup_codes';
SET @sql = IF(
  NOT EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='users' AND COLUMN_NAME=@col),
  'ALTER TABLE users ADD COLUMN backup_codes TEXT AFTER two_factor_secret',
  'SELECT "backup_codes already exists"'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Cho phép password NULL (Google OAuth users không có password thật)
ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

-- Tạo index nếu chưa có
SET @idx = 'idx_google_id';
SET @sql = IF(
  EXISTS(SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=@db AND TABLE_NAME='users' AND INDEX_NAME=@idx),
  'SELECT "idx_google_id already exists"',
  'CREATE INDEX idx_google_id ON users(google_id)'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Xem kết quả
DESCRIBE users;
