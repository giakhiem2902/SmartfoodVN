-- ============================================================
-- SEED DATA - SmartFood
-- Địa điểm thực tế: Quận Thủ Đức (TP. Thủ Đức), TP.HCM
-- ============================================================
USE smartfood;

-- ============================================================
-- 1. USERS (store owners) - chèn sau user admin/driver/store ở trên
--    Dùng INSERT IGNORE để không lỗi nếu chạy lại
-- ============================================================
INSERT IGNORE INTO users (username, email, password, role, phone, created_at, updated_at) VALUES
('quan_an_binhduong',  'owner1@smartfood.com', '$2a$10$wMpZVuoFgfLRXG1EBPyYUe5P2sxLQlkkp9fUTn3qU9RFVwtk3VZ/2', 'store', '0909111001', NOW(), NOW()),
('com_tam_thu_duc',    'owner2@smartfood.com', '$2a$10$wMpZVuoFgfLRXG1EBPyYUe5P2sxLQlkkp9fUTn3qU9RFVwtk3VZ/2', 'store', '0909111002', NOW(), NOW()),
('bun_bo_hue_123',     'owner3@smartfood.com', '$2a$10$wMpZVuoFgfLRXG1EBPyYUe5P2sxLQlkkp9fUTn3qU9RFVwtk3VZ/2', 'store', '0909111003', NOW(), NOW()),
('pho_suong_thu_duc',  'owner4@smartfood.com', '$2a$10$wMpZVuoFgfLRXG1EBPyYUe5P2sxLQlkkp9fUTn3qU9RFVwtk3VZ/2', 'store', '0909111004', NOW(), NOW()),
('mi_quang_da_nang',   'owner5@smartfood.com', '$2a$10$wMpZVuoFgfLRXG1EBPyYUe5P2sxLQlkkp9fUTn3qU9RFVwtk3VZ/2', 'store', '0909111005', NOW(), NOW());

-- ============================================================
-- 2. STORES (5 quán thực tế tại Thủ Đức)
-- ============================================================
INSERT INTO stores (owner_id, name, address, phone, lat, lng, is_active, opening_time, closing_time, description) VALUES
(
  (SELECT id FROM users WHERE email='owner1@smartfood.com'),
  'Quán Cơm Bình Dân Số 1',
  '12 Đường Võ Văn Ngân, Phường Bình Thọ, TP. Thủ Đức, TP.HCM',
  '0909111001',
  10.85060, 106.77420,
  TRUE, '06:00:00', '21:00:00',
  'Quán cơm bình dân ngon, giá rẻ, phục vụ nhanh gần Đại học Bách Khoa'
),
(
  (SELECT id FROM users WHERE email='owner2@smartfood.com'),
  'Cơm Tấm Thuý - Thủ Đức',
  '45 Đường Lê Văn Việt, Phường Hiệp Phú, TP. Thủ Đức, TP.HCM',
  '0909111002',
  10.84790, 106.78350,
  TRUE, '05:30:00', '14:00:00',
  'Cơm tấm sườn bì chả nổi tiếng, mở cửa sớm, đông khách buổi sáng'
),
(
  (SELECT id FROM users WHERE email='owner3@smartfood.com'),
  'Bún Bò Huế Mệ Tám',
  '78 Đường Đặng Văn Bi, Phường Bình Thọ, TP. Thủ Đức, TP.HCM',
  '0909111003',
  10.85320, 106.76890,
  TRUE, '06:00:00', '11:30:00',
  'Bún bò Huế chuẩn vị miền Trung, nước lèo đậm đà, thịt heo giò hầm mềm'
),
(
  (SELECT id FROM users WHERE email='owner4@smartfood.com'),
  'Phở Sướng - Thủ Đức',
  '201 Đường Hoàng Diệu 2, Phường Linh Chiểu, TP. Thủ Đức, TP.HCM',
  '0909111004',
  10.87150, 106.75640,
  TRUE, '05:00:00', '12:00:00',
  'Phở bò Nam Định chuẩn vị, bánh phở dai, nước dùng hầm xương 12 tiếng'
),
(
  (SELECT id FROM users WHERE email='owner5@smartfood.com'),
  'Mì Quảng Đà Nẵng Chính Gốc',
  '33 Đường Kha Vạn Cân, Phường Linh Đông, TP. Thủ Đức, TP.HCM',
  '0909111005',
  10.86420, 106.76120,
  TRUE, '07:00:00', '20:00:00',
  'Mì Quảng chuẩn Đà Nẵng, tôm thịt đầy đặn, bánh tráng mè giòn rụm'
);

-- ============================================================
-- 3. CATEGORIES
-- ============================================================

-- Store 1: Quán Cơm Bình Dân
INSERT INTO categories (store_id, name, description, display_order) VALUES
((SELECT id FROM stores WHERE phone='0909111001'), 'Cơm dĩa',      'Các loại cơm phần đầy đặn',         1),
((SELECT id FROM stores WHERE phone='0909111001'), 'Món kho',       'Thịt kho, cá kho, tép kho',          2),
((SELECT id FROM stores WHERE phone='0909111001'), 'Canh & súp',    'Canh chua, canh khổ qua, súp...',    3),
((SELECT id FROM stores WHERE phone='0909111001'), 'Nước uống',     'Trà đá, nước ngọt, sinh tố',         4);

-- Store 2: Cơm Tấm Thuý
INSERT INTO categories (store_id, name, description, display_order) VALUES
((SELECT id FROM stores WHERE phone='0909111002'), 'Cơm tấm sườn',  'Cơm tấm sườn bì chả các loại',      1),
((SELECT id FROM stores WHERE phone='0909111002'), 'Bì chả',        'Bì, chả trứng, chả thịt',            2),
((SELECT id FROM stores WHERE phone='0909111002'), 'Nước uống',     'Cà phê sữa đá, trà đá',              3);

-- Store 3: Bún Bò Mệ Tám
INSERT INTO categories (store_id, name, description, display_order) VALUES
((SELECT id FROM stores WHERE phone='0909111003'), 'Bún bò Huế',    'Bún bò, bún giò, bún hỗn hợp',      1),
((SELECT id FROM stores WHERE phone='0909111003'), 'Ăn kèm',        'Rau sống, chả Huế, huyết',           2),
((SELECT id FROM stores WHERE phone='0909111003'), 'Nước uống',     'Nước sâm, trà đá',                   3);

-- Store 4: Phở Sướng
INSERT INTO categories (store_id, name, description, display_order) VALUES
((SELECT id FROM stores WHERE phone='0909111004'), 'Phở bò',        'Phở tái, chín, nạm, gầu...',         1),
((SELECT id FROM stores WHERE phone='0909111004'), 'Phở gà',        'Phở gà ta, gà công nghiệp',          2),
((SELECT id FROM stores WHERE phone='0909111004'), 'Ăn kèm',        'Quẩy, trứng, thịt thêm',             3);

-- Store 5: Mì Quảng
INSERT INTO categories (store_id, name, description, display_order) VALUES
((SELECT id FROM stores WHERE phone='0909111005'), 'Mì Quảng',      'Mì Quảng tôm thịt, gà, chay',       1),
((SELECT id FROM stores WHERE phone='0909111005'), 'Cao lầu',       'Cao lầu Hội An đặc biệt',            2),
((SELECT id FROM stores WHERE phone='0909111005'), 'Nước uống',     'Chè, nước sâm Hội An',               3);

-- ============================================================
-- 4. FOODS
-- ============================================================

-- === Store 1: Cơm Bình Dân ===
INSERT INTO foods (store_id, category_id, name, description, price, is_available, is_featured, preparation_time) VALUES

-- Cơm dĩa
((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Cơm dĩa'),
 'Cơm sườn nướng', 'Cơm trắng + sườn nướng than hoa + canh + rau', 35000, TRUE, TRUE, 10),

((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Cơm dĩa'),
 'Cơm gà chiên nước mắm', 'Cơm trắng + đùi gà chiên nước mắm + dưa leo', 38000, TRUE, FALSE, 12),

((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Cơm dĩa'),
 'Cơm thịt kho trứng', 'Cơm trắng + thịt ba chỉ kho trứng + canh chua', 32000, TRUE, FALSE, 10),

((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Cơm dĩa'),
 'Cơm chay đặc biệt', 'Cơm trắng + đậu hũ + rau củ xào + canh', 28000, TRUE, FALSE, 10),

-- Món kho
((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Món kho'),
 'Cá basa kho tộ', 'Cá basa kho sả ớt, nước kho đậm đà', 25000, TRUE, FALSE, 15),

((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Món kho'),
 'Thịt ba chỉ kho tiêu', 'Thịt ba chỉ kho tiêu đậm, ăn kèm cơm trắng', 22000, TRUE, FALSE, 15),

-- Canh
((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Canh & súp'),
 'Canh chua cá lóc', 'Canh chua nấu với cá lóc, cà chua, dứa, giá', 20000, TRUE, FALSE, 15),

((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Canh & súp'),
 'Canh khổ qua nhồi thịt', 'Khổ qua nhồi thịt heo xay, nước dùng ngọt thanh', 22000, TRUE, FALSE, 20),

-- Nước uống
((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Nước uống'),
 'Trà đá', 'Trà đá miễn phí khi mua cơm', 0, TRUE, FALSE, 2),

((SELECT id FROM stores WHERE phone='0909111001'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111001') AND name='Nước uống'),
 'Nước ngọt lon', 'Pepsi, 7Up, Mirinda (1 lon)', 12000, TRUE, FALSE, 2);

-- === Store 2: Cơm Tấm Thuý ===
INSERT INTO foods (store_id, category_id, name, description, price, is_available, is_featured, preparation_time) VALUES

((SELECT id FROM stores WHERE phone='0909111002'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111002') AND name='Cơm tấm sườn'),
 'Cơm tấm sườn bì chả', 'Phần đầy đủ: sườn nướng + bì + chả trứng + mỡ hành + đồ chua', 45000, TRUE, TRUE, 10),

((SELECT id FROM stores WHERE phone='0909111002'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111002') AND name='Cơm tấm sườn'),
 'Cơm tấm sườn đặc biệt', 'Sườn cốt lết nướng lớn + trứng ốp la + bì + chả', 55000, TRUE, TRUE, 12),

((SELECT id FROM stores WHERE phone='0909111002'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111002') AND name='Cơm tấm sườn'),
 'Cơm tấm sườn nướng', 'Chỉ sườn nướng + cơm tấm, không kèm bì chả', 38000, TRUE, FALSE, 10),

((SELECT id FROM stores WHERE phone='0909111002'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111002') AND name='Cơm tấm sườn'),
 'Cơm tấm gà nướng', 'Đùi gà nướng lửa than + cơm tấm + đồ chua', 42000, TRUE, FALSE, 15),

((SELECT id FROM stores WHERE phone='0909111002'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111002') AND name='Bì chả'),
 'Chả trứng hấp', 'Chả thịt heo + trứng hấp kiểu Sài Gòn', 15000, TRUE, FALSE, 5),

((SELECT id FROM stores WHERE phone='0909111002'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111002') AND name='Bì chả'),
 'Bì heo trộn', 'Bì heo thái sợi trộn thính, thơm ngon', 12000, TRUE, FALSE, 5),

((SELECT id FROM stores WHERE phone='0909111002'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111002') AND name='Nước uống'),
 'Cà phê sữa đá', 'Cà phê phin truyền thống + sữa đặc + đá', 18000, TRUE, FALSE, 5),

((SELECT id FROM stores WHERE phone='0909111002'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111002') AND name='Nước uống'),
 'Trà đá', 'Trà đá miễn phí khi mua cơm tấm', 0, TRUE, FALSE, 2);

-- === Store 3: Bún Bò Mệ Tám ===
INSERT INTO foods (store_id, category_id, name, description, price, is_available, is_featured, preparation_time) VALUES

((SELECT id FROM stores WHERE phone='0909111003'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111003') AND name='Bún bò Huế'),
 'Bún bò Huế đặc biệt', 'Tô lớn đầy đủ: bò, giò heo, huyết, chả Huế, nước lèo đậm', 55000, TRUE, TRUE, 10),

((SELECT id FROM stores WHERE phone='0909111003'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111003') AND name='Bún bò Huế'),
 'Bún bò thường', 'Tô bún bò cơ bản: thịt bò + nước lèo cay thơm', 40000, TRUE, FALSE, 10),

((SELECT id FROM stores WHERE phone='0909111003'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111003') AND name='Bún bò Huế'),
 'Bún giò heo', 'Tô bún với giò heo hầm mềm rục, đậm vị', 50000, TRUE, FALSE, 10),

((SELECT id FROM stores WHERE phone='0909111003'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111003') AND name='Bún bò Huế'),
 'Bún hỗn hợp', 'Bò + giò + huyết + chả Huế trong 1 tô', 60000, TRUE, TRUE, 10),

((SELECT id FROM stores WHERE phone='0909111003'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111003') AND name='Ăn kèm'),
 'Chả Huế', 'Chả lụa Huế thơm ngon, ăn kèm bún bò', 10000, TRUE, FALSE, 2),

((SELECT id FROM stores WHERE phone='0909111003'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111003') AND name='Ăn kèm'),
 'Huyết heo', 'Huyết heo cắt miếng, thêm vào tô bún', 8000, TRUE, FALSE, 2),

((SELECT id FROM stores WHERE phone='0909111003'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111003') AND name='Nước uống'),
 'Nước sâm đá', 'Nước sâm mát lạnh, giải nhiệt sau tô bún cay', 15000, TRUE, FALSE, 2),

((SELECT id FROM stores WHERE phone='0909111003'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111003') AND name='Nước uống'),
 'Trà đá', 'Trà đá free khi mua bún bò', 0, TRUE, FALSE, 2);

-- === Store 4: Phở Sướng ===
INSERT INTO foods (store_id, category_id, name, description, price, is_available, is_featured, preparation_time) VALUES

((SELECT id FROM stores WHERE phone='0909111004'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111004') AND name='Phở bò'),
 'Phở bò tái chín', 'Tô phở bò tái + chín, nước dùng hầm xương 12 tiếng', 55000, TRUE, TRUE, 8),

((SELECT id FROM stores WHERE phone='0909111004'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111004') AND name='Phở bò'),
 'Phở bò tái lăn', 'Thịt bò tái lăn qua nước dùng sôi, mềm vừa', 58000, TRUE, FALSE, 8),

((SELECT id FROM stores WHERE phone='0909111004'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111004') AND name='Phở bò'),
 'Phở bò gầu béo', 'Tô phở với gầu bò béo ngậy, đậm đà', 60000, TRUE, TRUE, 8),

((SELECT id FROM stores WHERE phone='0909111004'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111004') AND name='Phở bò'),
 'Phở bò đặc biệt', 'Tái + chín + gầu + nạm trong 1 tô lớn', 75000, TRUE, FALSE, 10),

((SELECT id FROM stores WHERE phone='0909111004'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111004') AND name='Phở gà'),
 'Phở gà ta', 'Tô phở gà ta chặt miếng, nước trong ngọt', 50000, TRUE, FALSE, 8),

((SELECT id FROM stores WHERE phone='0909111004'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111004') AND name='Phở gà'),
 'Phở gà xé', 'Gà xé sợi, ăn kèm gừng và hành phi', 48000, TRUE, FALSE, 8),

((SELECT id FROM stores WHERE phone='0909111004'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111004') AND name='Ăn kèm'),
 'Quẩy', '2 cái quẩy giòn, chấm cùng nước phở', 8000, TRUE, FALSE, 2),

((SELECT id FROM stores WHERE phone='0909111004'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111004') AND name='Ăn kèm'),
 'Thịt bò thêm', 'Thêm 50g thịt bò vào tô phở', 20000, TRUE, FALSE, 2);

-- === Store 5: Mì Quảng ===
INSERT INTO foods (store_id, category_id, name, description, price, is_available, is_featured, preparation_time) VALUES

((SELECT id FROM stores WHERE phone='0909111005'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111005') AND name='Mì Quảng'),
 'Mì Quảng tôm thịt', 'Mì sợi vàng + tôm sú + thịt heo + trứng cút + bánh tráng mè', 50000, TRUE, TRUE, 12),

((SELECT id FROM stores WHERE phone='0909111005'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111005') AND name='Mì Quảng'),
 'Mì Quảng gà', 'Mì Quảng thịt gà ta xé, nước nhân thơm nghệ', 48000, TRUE, FALSE, 12),

((SELECT id FROM stores WHERE phone='0909111005'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111005') AND name='Mì Quảng'),
 'Mì Quảng ếch', 'Mì Quảng ếch đồng đặc sản, đậm vị miền Trung', 58000, TRUE, TRUE, 15),

((SELECT id FROM stores WHERE phone='0909111005'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111005') AND name='Mì Quảng'),
 'Mì Quảng chay', 'Mì Quảng chay với đậu hũ, nấm, rau củ', 38000, TRUE, FALSE, 12),

((SELECT id FROM stores WHERE phone='0909111005'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111005') AND name='Cao lầu'),
 'Cao lầu Hội An', 'Mì cao lầu + thịt xá xíu + tôm + rau sống + bánh tráng', 55000, TRUE, TRUE, 15),

((SELECT id FROM stores WHERE phone='0909111005'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111005') AND name='Cao lầu'),
 'Cao lầu đặc biệt', 'Cao lầu thêm tôm và xá xíu, phần lớn hơn', 65000, TRUE, FALSE, 15),

((SELECT id FROM stores WHERE phone='0909111005'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111005') AND name='Nước uống'),
 'Chè đậu xanh', 'Chè đậu xanh nước dừa mát lạnh', 18000, TRUE, FALSE, 5),

((SELECT id FROM stores WHERE phone='0909111005'),
 (SELECT id FROM categories WHERE store_id=(SELECT id FROM stores WHERE phone='0909111005') AND name='Nước uống'),
 'Nước sâm Hội An', 'Nước sâm đặc trưng Hội An, thanh mát giải nhiệt', 20000, TRUE, FALSE, 3);

-- ============================================================
-- KIỂM TRA KẾT QUẢ
-- ============================================================
SELECT '=== STORES ===' AS info;
SELECT id, name, address, lat, lng FROM stores;

SELECT '=== CATEGORIES ===' AS info;
SELECT c.id, s.name AS store_name, c.name AS category, c.display_order
FROM categories c JOIN stores s ON c.store_id = s.id
ORDER BY s.id, c.display_order;

SELECT '=== FOODS COUNT PER STORE ===' AS info;
SELECT s.name AS store_name, COUNT(f.id) AS total_foods
FROM foods f JOIN stores s ON f.store_id = s.id
GROUP BY s.id, s.name;
