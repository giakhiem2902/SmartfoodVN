USE smartfood;

-- ============================================================
-- CẬP NHẬT ẢNH CHO CATEGORIES
-- ============================================================
-- Store 1: Quán Cơm Bình Dân (id 17-20)
UPDATE categories SET image_url = '/uploads/categories/com-dia.jpg'   WHERE id = 17; -- Cơm dĩa
UPDATE categories SET image_url = '/uploads/categories/mon-kho.jpg'   WHERE id = 18; -- Món kho
UPDATE categories SET image_url = '/uploads/categories/canh-sup.jpg'  WHERE id = 19; -- Canh & súp
UPDATE categories SET image_url = '/uploads/categories/nuoc-uong.jpg' WHERE id = 20; -- Nước uống

-- Store 2: Cơm Tấm Thuý (id 21-23)
UPDATE categories SET image_url = '/uploads/categories/com-tam-suon.jpg' WHERE id = 21; -- Cơm tấm sườn
UPDATE categories SET image_url = '/uploads/categories/bi-cha.jpg'       WHERE id = 22; -- Bì chả
UPDATE categories SET image_url = '/uploads/categories/nuoc-uong.jpg'    WHERE id = 23; -- Nước uống

-- Store 3: Bún Bò Mệ Tám (id 24-26)
UPDATE categories SET image_url = '/uploads/categories/bun-bo-hue.jpg'  WHERE id = 24; -- Bún bò Huế
UPDATE categories SET image_url = '/uploads/categories/rau.jpg'          WHERE id = 25; -- Ăn kèm
UPDATE categories SET image_url = '/uploads/categories/nuoc-uong.jpg'    WHERE id = 26; -- Nước uống

-- Store 4: Phở Sướng (id 27-29)
UPDATE categories SET image_url = '/uploads/categories/pho-bo.jpg'      WHERE id = 27; -- Phở bò
UPDATE categories SET image_url = '/uploads/categories/pho-ga.jpg'      WHERE id = 28; -- Phở gà
UPDATE categories SET image_url = '/uploads/categories/quay.jpg'        WHERE id = 29; -- Ăn kèm (quẩy)

-- Store 5: Mì Quảng (id 30-32)
UPDATE categories SET image_url = '/uploads/categories/mi-quang.jpg'   WHERE id = 30; -- Mì Quảng
UPDATE categories SET image_url = '/uploads/categories/cao-lau.jpg'    WHERE id = 31; -- Cao lầu
UPDATE categories SET image_url = '/uploads/categories/che.jpg'        WHERE id = 32; -- Nước uống (chè)

-- ============================================================
-- CẬP NHẬT ẢNH CHO STORES
-- ============================================================
UPDATE stores SET image_url = '/uploads/stores/com-binh-dan.jpg'    WHERE phone = '0909111001';
UPDATE stores SET image_url = '/uploads/stores/com-tam.jpg'         WHERE phone = '0909111002';
UPDATE stores SET image_url = '/uploads/stores/bun-bo-hue-me-tam.jpg' WHERE phone = '0909111003';
UPDATE stores SET image_url = '/uploads/stores/pho-suong.jpg'       WHERE phone = '0909111004';
UPDATE stores SET image_url = '/uploads/stores/mi-quang-da-nang.jpg' WHERE phone = '0909111005';

-- ============================================================
-- CẬP NHẬT ẢNH CHO FOODS (dựa theo tên file trong uploads/foods/)
-- ============================================================

-- Store 1: Cơm Bình Dân
UPDATE foods SET image_url = '/uploads/foods/com-suon-nuong.jpg'     WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%sườn nướng%' AND name LIKE '%Cơm%' AND name NOT LIKE '%Tấm%';
UPDATE foods SET image_url = '/uploads/foods/com-ga-nuoc-mam.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%gà chiên%';
UPDATE foods SET image_url = '/uploads/foods/com-thit-kho-trung.jpg' WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%thịt kho%';
UPDATE foods SET image_url = '/uploads/foods/com-chay.jpg'           WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%chay%';
UPDATE foods SET image_url = '/uploads/foods/ca-basa-kho-to.jpg'     WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%basa%';
UPDATE foods SET image_url = '/uploads/foods/thit-ba-chi-kho.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%ba chỉ kho%';
UPDATE foods SET image_url = '/uploads/foods/canh-chua-ca-loc.jpg'   WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%canh chua%';
UPDATE foods SET image_url = '/uploads/foods/canh-kho-qua.jpg'       WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%khổ qua%';
UPDATE foods SET image_url = '/uploads/foods/tra-da.jpg'             WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%Trà đá%';
UPDATE foods SET image_url = '/uploads/foods/nuoc-ngot-lon.jpg'      WHERE store_id = (SELECT id FROM stores WHERE phone='0909111001') AND name LIKE '%ngọt%';

-- Store 2: Cơm Tấm
UPDATE foods SET image_url = '/uploads/foods/com-suon-bi-cha.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111002') AND name LIKE '%sườn bì chả%';
UPDATE foods SET image_url = '/uploads/foods/com-suon-dac-biet.jpg'  WHERE store_id = (SELECT id FROM stores WHERE phone='0909111002') AND name LIKE '%đặc biệt%';
UPDATE foods SET image_url = '/uploads/foods/com-suon-nuong.jpg'     WHERE store_id = (SELECT id FROM stores WHERE phone='0909111002') AND name LIKE '%sườn nướng%';
UPDATE foods SET image_url = '/uploads/foods/com-tam-ga.jpg'         WHERE store_id = (SELECT id FROM stores WHERE phone='0909111002') AND name LIKE '%gà nướng%';
UPDATE foods SET image_url = '/uploads/foods/cha-trung-hap.jpg'      WHERE store_id = (SELECT id FROM stores WHERE phone='0909111002') AND name LIKE '%Chả trứng%';
UPDATE foods SET image_url = '/uploads/foods/bi-heo-tron.jpg'        WHERE store_id = (SELECT id FROM stores WHERE phone='0909111002') AND name LIKE '%Bì heo%';
UPDATE foods SET image_url = '/uploads/foods/ca-phe-sua-da.jpg'      WHERE store_id = (SELECT id FROM stores WHERE phone='0909111002') AND name LIKE '%cà phê%';
UPDATE foods SET image_url = '/uploads/foods/tra-da.jpg'             WHERE store_id = (SELECT id FROM stores WHERE phone='0909111002') AND name LIKE '%Trà đá%';

-- Store 3: Bún Bò
UPDATE foods SET image_url = '/uploads/foods/bun-bo-dac-biet.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111003') AND name LIKE '%đặc biệt%';
UPDATE foods SET image_url = '/uploads/foods/bun-bo-thuong.jpg'      WHERE store_id = (SELECT id FROM stores WHERE phone='0909111003') AND name LIKE '%thường%';
UPDATE foods SET image_url = '/uploads/foods/bun-gio-heo.jpg'        WHERE store_id = (SELECT id FROM stores WHERE phone='0909111003') AND name LIKE '%giò heo%';
UPDATE foods SET image_url = '/uploads/foods/bun-bo-hon-hop.jpg'     WHERE store_id = (SELECT id FROM stores WHERE phone='0909111003') AND name LIKE '%hỗn hợp%';
UPDATE foods SET image_url = '/uploads/foods/cha-hue.jpg'            WHERE store_id = (SELECT id FROM stores WHERE phone='0909111003') AND name LIKE '%Chả Huế%';
UPDATE foods SET image_url = '/uploads/foods/huyet-heo.jpg'          WHERE store_id = (SELECT id FROM stores WHERE phone='0909111003') AND name LIKE '%Huyết%';
UPDATE foods SET image_url = '/uploads/foods/nuoc-sam-da.jpg'        WHERE store_id = (SELECT id FROM stores WHERE phone='0909111003') AND name LIKE '%sâm%';
UPDATE foods SET image_url = '/uploads/foods/tra-da.jpg'             WHERE store_id = (SELECT id FROM stores WHERE phone='0909111003') AND name LIKE '%Trà đá%';

-- Store 4: Phở Sướng
UPDATE foods SET image_url = '/uploads/foods/com-suon-bi-cha.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111004') AND name LIKE '%tái chín%';
UPDATE foods SET image_url = '/uploads/foods/com-suon-nuong.jpg'     WHERE store_id = (SELECT id FROM stores WHERE phone='0909111004') AND name LIKE '%tái lăn%';
UPDATE foods SET image_url = '/uploads/foods/bun-bo-dac-biet.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111004') AND name LIKE '%gầu%';
UPDATE foods SET image_url = '/uploads/foods/bun-bo-hon-hop.jpg'     WHERE store_id = (SELECT id FROM stores WHERE phone='0909111004') AND name LIKE '%Phở bò đặc biệt%';
UPDATE foods SET image_url = '/uploads/foods/com-ga-nuoc-mam.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111004') AND name LIKE '%gà ta%';
UPDATE foods SET image_url = '/uploads/foods/com-thit-kho-trung.jpg' WHERE store_id = (SELECT id FROM stores WHERE phone='0909111004') AND name LIKE '%gà xé%';
UPDATE foods SET image_url = '/uploads/foods/nuoc-ngot-lon.jpg'      WHERE store_id = (SELECT id FROM stores WHERE phone='0909111004') AND name LIKE '%Quẩy%';
UPDATE foods SET image_url = '/uploads/foods/thit-ba-chi-kho.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111004') AND name LIKE '%thêm%';

-- Store 5: Mì Quảng
UPDATE foods SET image_url = '/uploads/foods/com-suon-bi-cha.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111005') AND name LIKE '%tôm thịt%';
UPDATE foods SET image_url = '/uploads/foods/com-ga-nuoc-mam.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111005') AND name LIKE '%Mì Quảng gà%';
UPDATE foods SET image_url = '/uploads/foods/canh-chua-ca-loc.jpg'   WHERE store_id = (SELECT id FROM stores WHERE phone='0909111005') AND name LIKE '%ếch%';
UPDATE foods SET image_url = '/uploads/foods/com-chay.jpg'           WHERE store_id = (SELECT id FROM stores WHERE phone='0909111005') AND name LIKE '%Mì Quảng chay%';
UPDATE foods SET image_url = '/uploads/foods/cao-lau.jpg'            WHERE store_id = (SELECT id FROM stores WHERE phone='0909111005') AND name LIKE '%Cao lầu Hội An%';
UPDATE foods SET image_url = '/uploads/foods/bun-bo-dac-biet.jpg'    WHERE store_id = (SELECT id FROM stores WHERE phone='0909111005') AND name LIKE '%Cao lầu đặc biệt%';
UPDATE foods SET image_url = '/uploads/foods/nuoc-sam-da.jpg'        WHERE store_id = (SELECT id FROM stores WHERE phone='0909111005') AND name LIKE '%sâm Hội An%';
UPDATE foods SET image_url = '/uploads/foods/ca-phe-sua-da.jpg'      WHERE store_id = (SELECT id FROM stores WHERE phone='0909111005') AND name LIKE '%đậu xanh%';

-- ============================================================
-- KIỂM TRA
-- ============================================================
SELECT 'CATEGORIES WITH IMAGES:' AS info;
SELECT id, name, image_url FROM categories ORDER BY id;

SELECT 'STORES WITH IMAGES:' AS info;
SELECT id, name, image_url FROM stores ORDER BY id;

SELECT 'FOODS WITHOUT IMAGES:' AS info;
SELECT id, name, image_url FROM foods WHERE image_url IS NULL ORDER BY id;
