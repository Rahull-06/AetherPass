-- AetherPass seed data — realistic starter catalog (dev / demo)
USE aetherpass;

INSERT INTO roles (name, description) VALUES
('ROLE_USER', 'Regular ticket buyer'),
('ROLE_ORGANIZER', 'Event organizer'),
('ROLE_ADMIN', 'Platform administrator')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Password for all seed users: Password@123
INSERT INTO users (email, password_hash, full_name, phone, status, email_verified) VALUES
('admin@aetherpass.dev', '$2a$10$I0HbgBwK/dQKPPn5o5MsQOJM7pxfEUAAzhKcGim/odSDfUwGWtmwy', 'Aether Admin', '9000000001', 'ACTIVE', TRUE),
('organizer@livearena.in', '$2a$10$I0HbgBwK/dQKPPn5o5MsQOJM7pxfEUAAzhKcGim/odSDfUwGWtmwy', 'Riya Sharma', '9000000002', 'ACTIVE', TRUE),
('user@example.com', '$2a$10$I0HbgBwK/dQKPPn5o5MsQOJM7pxfEUAAzhKcGim/odSDfUwGWtmwy', 'Arjun Mehta', '9000000003', 'ACTIVE', TRUE)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), full_name = VALUES(full_name);

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_ADMIN' WHERE u.email = 'admin@aetherpass.dev'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_ORGANIZER' WHERE u.email = 'organizer@livearena.in'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u JOIN roles r ON r.name = 'ROLE_USER' WHERE u.email = 'user@example.com'
ON DUPLICATE KEY UPDATE user_id = user_id;

INSERT INTO organizers (user_id, company_name, gstin, verified)
SELECT id, 'Live Arena Productions', '27AABCU9603R1ZM', TRUE
FROM users WHERE email = 'organizer@livearena.in'
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

INSERT INTO venues (name, address_line, city, state, country, pincode, capacity) VALUES
('Jio World Garden', 'Bandra Kurla Complex', 'Mumbai', 'Maharashtra', 'India', '400051', 5000),
('Palace Grounds', 'Jayamahal Main Road', 'Bengaluru', 'Karnataka', 'India', '560006', 8000),
('NSCI Dome', 'Lotus Sports Complex, Worli', 'Mumbai', 'Maharashtra', 'India', '400018', 3500),
('Hitex Exhibition Centre', 'HITEX, Madhapur', 'Hyderabad', 'Telangana', 'India', '500081', 6000),
('Shilpakala Vedika', 'Madhapur', 'Hyderabad', 'Telangana', 'India', '500081', 2500)
ON DUPLICATE KEY UPDATE capacity = VALUES(capacity);

INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_uses, valid_from, valid_until, active) VALUES
('WELCOME100', 'Flat Rs.100 off', 'FLAT', 100.00, 0.00, 10000, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE),
('EARLYBIRD', '15% off early bookings', 'PERCENT', 15.00, 500.00, 5000, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), TRUE),
('FESTIVAL', 'Flat Rs.250 off on Rs.1000+', 'FLAT', 250.00, 1000.00, 2000, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), TRUE),
('STUDENT', '10% student discount', 'PERCENT', 10.00, 0.00, 8000, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE),
('SAVE10', '10% off on Rs.1000+', 'PERCENT', 10.00, 1000.00, 10000, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description), min_order_amount = VALUES(min_order_amount);
