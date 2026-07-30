-- Add minimum cart amount for coupon eligibility + Hyderabad venues
USE aetherpass;

-- Run once on existing DBs (safe to skip if column already exists)
-- ALTER TABLE coupons ADD COLUMN min_order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER discount_value;

UPDATE coupons SET
    description = CASE code
        WHEN 'WELCOME100' THEN 'Flat Rs.100 off'
        WHEN 'EARLYBIRD' THEN '15% off on Rs.500+'
        WHEN 'FESTIVAL' THEN 'Flat Rs.250 off on Rs.1000+'
        WHEN 'STUDENT' THEN '10% student discount'
        ELSE description
    END,
    min_order_amount = CASE code
        WHEN 'WELCOME100' THEN 0
        WHEN 'EARLYBIRD' THEN 500
        WHEN 'FESTIVAL' THEN 1000
        WHEN 'STUDENT' THEN 0
        ELSE COALESCE(min_order_amount, 0)
    END
WHERE code IN ('WELCOME100', 'EARLYBIRD', 'FESTIVAL', 'STUDENT');

INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_from, valid_until, active)
SELECT 'SAVE10', '10% off on Rs.1000+', 'PERCENT', 10.00, 1000.00, 10000, 0, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'SAVE10');

INSERT INTO venues (name, address_line, city, state, country, pincode, capacity)
SELECT 'Hitex Exhibition Centre', 'HITEX, Madhapur', 'Hyderabad', 'Telangana', 'India', '500081', 6000
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Hitex Exhibition Centre' AND city = 'Hyderabad');

INSERT INTO venues (name, address_line, city, state, country, pincode, capacity)
SELECT 'Shilpakala Vedika', 'Madhapur', 'Hyderabad', 'Telangana', 'India', '500081', 2500
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM venues WHERE name = 'Shilpakala Vedika' AND city = 'Hyderabad');
