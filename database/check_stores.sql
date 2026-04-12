-- Check if stores exist
SELECT id, name FROM stores LIMIT 5;

-- If no stores, insert a default one
INSERT INTO stores (owner_id, name, address, phone, lat, lng, is_active, created_at, updated_at)
SELECT 1, 'Default Store', 'Default Address', '0000000000', 10.7769, 106.6966, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM stores LIMIT 1);

-- Verify
SELECT id, name FROM stores LIMIT 5;
