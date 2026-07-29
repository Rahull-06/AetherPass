USE aetherpass;

-- Correct bcrypt for Password@123 (do not rely on PowerShell $ expansion)
UPDATE users
SET password_hash = '$2a$10$I0HbgBwK/dQKPPn5o5MsQOJM7pxfEUAAzhKcGim/odSDfUwGWtmwy'
WHERE email IN ('admin@aetherpass.dev', 'organizer@livearena.in', 'user@example.com');
