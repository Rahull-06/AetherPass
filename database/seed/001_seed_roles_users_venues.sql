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
('NSCI Dome', 'Lotus Sports Complex, Worli', 'Mumbai', 'Maharashtra', 'India', '400018', 3500)
ON DUPLICATE KEY UPDATE capacity = VALUES(capacity);

INSERT INTO coupons (code, description, discount_type, discount_value, max_uses, valid_from, valid_until, active) VALUES
('WELCOME100', 'Flat ₹100 off first booking', 'FLAT', 100.00, 10000, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE),
('EARLYBIRD', '15% off early bookings', 'PERCENT', 15.00, 5000, NOW(), DATE_ADD(NOW(), INTERVAL 6 MONTH), TRUE),
('FESTIVAL', 'Festival season ₹250 off', 'FLAT', 250.00, 2000, NOW(), DATE_ADD(NOW(), INTERVAL 3 MONTH), TRUE),
('STUDENT', '10% student discount', 'PERCENT', 10.00, 8000, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE)
ON DUPLICATE KEY UPDATE description = VALUES(description);
