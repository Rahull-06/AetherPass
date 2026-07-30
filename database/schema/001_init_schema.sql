-- AetherPass — canonical MySQL schema (source of truth for DB design)
-- Engine: InnoDB | Charset: utf8mb4

CREATE DATABASE IF NOT EXISTS aetherpass
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aetherpass;

-- -------------------------------------------------
-- Identity & access
-- -------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(50)  NOT NULL UNIQUE, -- ROLE_USER | ROLE_ORGANIZER | ROLE_ADMIN
    description   VARCHAR(255),
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20),
    status          VARCHAR(30)  NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | SUSPENDED | DELETED
    email_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_users_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
    user_id  BIGINT NOT NULL,
    role_id  BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS organizers (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id       BIGINT       NOT NULL UNIQUE,
    company_name  VARCHAR(200) NOT NULL,
    gstin         VARCHAR(30),
    verified      BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_organizers_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP    NOT NULL,
    revoked     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_refresh_tokens_user (user_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    token_hash  VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMP    NOT NULL,
    used        BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_reset_tokens_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_password_reset_user (user_id)
) ENGINE=InnoDB;

-- -------------------------------------------------
-- Catalog: venues & events
-- -------------------------------------------------

CREATE TABLE IF NOT EXISTS venues (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    name          VARCHAR(200) NOT NULL,
    address_line  VARCHAR(255) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    state         VARCHAR(100),
    country       VARCHAR(100) NOT NULL DEFAULT 'India',
    pincode       VARCHAR(20),
    latitude      DECIMAL(10, 7),
    longitude     DECIMAL(10, 7),
    capacity      INT,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_venues_city (city)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS events (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    organizer_id    BIGINT       NOT NULL,
    venue_id        BIGINT       NOT NULL,
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL UNIQUE,
    description     TEXT,
    category        VARCHAR(80)  NOT NULL, -- MUSIC | COMEDY | SPORTS | THEATRE | FESTIVAL | WORKSHOP
    banner_url      VARCHAR(500),
    starts_at       TIMESTAMP    NOT NULL,
    ends_at         TIMESTAMP    NOT NULL,
    status          VARCHAR(30)  NOT NULL DEFAULT 'DRAFT', -- DRAFT | PENDING_APPROVAL | PUBLISHED | CANCELLED | COMPLETED
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_events_organizer FOREIGN KEY (organizer_id) REFERENCES organizers(id),
    CONSTRAINT fk_events_venue FOREIGN KEY (venue_id) REFERENCES venues(id),
    INDEX idx_events_status_starts (status, starts_at),
    INDEX idx_events_category (category),
    FULLTEXT INDEX ft_events_search (title, description)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket_categories (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_id      BIGINT         NOT NULL,
    name          VARCHAR(100)   NOT NULL, -- VIP | Regular | Balcony
    description   VARCHAR(255),
    price         DECIMAL(12, 2) NOT NULL,
    currency      VARCHAR(3)     NOT NULL DEFAULT 'INR',
    total_seats   INT            NOT NULL,
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_categories_event FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE KEY uk_event_category_name (event_id, name)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS seats (
    id                   BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_id             BIGINT      NOT NULL,
    ticket_category_id   BIGINT      NOT NULL,
    row_label            VARCHAR(10) NOT NULL,
    seat_number          VARCHAR(10) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE | BOOKED | BLOCKED
    created_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_seats_event FOREIGN KEY (event_id) REFERENCES events(id),
    CONSTRAINT fk_seats_category FOREIGN KEY (ticket_category_id) REFERENCES ticket_categories(id),
    UNIQUE KEY uk_event_row_seat (event_id, row_label, seat_number),
    INDEX idx_seats_event_status (event_id, status)
) ENGINE=InnoDB;

-- -------------------------------------------------
-- Booking & payments
-- -------------------------------------------------

CREATE TABLE IF NOT EXISTS coupons (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    code            VARCHAR(50)    NOT NULL UNIQUE,
    description     VARCHAR(255),
    discount_type   VARCHAR(20)    NOT NULL, -- PERCENT | FLAT
    discount_value  DECIMAL(12, 2) NOT NULL,
    min_order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    max_uses        INT,
    used_count      INT            NOT NULL DEFAULT 0,
    valid_from      TIMESTAMP      NOT NULL,
    valid_until     TIMESTAMP      NOT NULL,
    active          BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_code    VARCHAR(40)    NOT NULL UNIQUE,
    user_id         BIGINT         NOT NULL,
    event_id        BIGINT         NOT NULL,
    coupon_id       BIGINT         NULL,
    status          VARCHAR(30)    NOT NULL DEFAULT 'PENDING', -- PENDING | CONFIRMED | CANCELLED | EXPIRED | REFUNDED
    subtotal        DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount    DECIMAL(12, 2) NOT NULL,
    currency        VARCHAR(3)     NOT NULL DEFAULT 'INR',
    expires_at      TIMESTAMP      NULL, -- seat hold window end
    created_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_bookings_event FOREIGN KEY (event_id) REFERENCES events(id),
    CONSTRAINT fk_bookings_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    INDEX idx_bookings_user (user_id),
    INDEX idx_bookings_event_status (event_id, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS tickets (
    id            BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id    BIGINT       NOT NULL,
    seat_id       BIGINT       NOT NULL,
    ticket_code   VARCHAR(60)  NOT NULL UNIQUE,
    qr_payload    VARCHAR(500) NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'VALID', -- VALID | USED | CANCELLED
    used_at       TIMESTAMP    NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tickets_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_tickets_seat FOREIGN KEY (seat_id) REFERENCES seats(id),
    UNIQUE KEY uk_tickets_seat (seat_id),
    INDEX idx_tickets_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS booking_seats (
    booking_id  BIGINT NOT NULL,
    seat_id     BIGINT NOT NULL,
    PRIMARY KEY (booking_id, seat_id),
    CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_booking_seats_seat FOREIGN KEY (seat_id) REFERENCES seats(id),
    UNIQUE KEY uk_booking_seats_seat (seat_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    id                   BIGINT PRIMARY KEY AUTO_INCREMENT,
    booking_id           BIGINT         NOT NULL UNIQUE,
    provider             VARCHAR(30)    NOT NULL DEFAULT 'RAZORPAY',
    provider_order_id    VARCHAR(100),
    provider_payment_id  VARCHAR(100),
    amount               DECIMAL(12, 2) NOT NULL,
    currency             VARCHAR(3)     NOT NULL DEFAULT 'INR',
    status               VARCHAR(30)    NOT NULL DEFAULT 'CREATED', -- CREATED | PAID | FAILED | REFUNDED
    raw_response         JSON,
    paid_at              TIMESTAMP      NULL,
    created_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    INDEX idx_payments_status (status)
) ENGINE=InnoDB;

-- -------------------------------------------------
-- Engagement
-- -------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    event_id    BIGINT NOT NULL,
    rating      TINYINT NOT NULL,
    comment     TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_reviews_event FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE KEY uk_review_user_event (user_id, event_id),
    CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS wishlists (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT NOT NULL,
    event_id    BIGINT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_wishlists_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_wishlists_event FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE KEY uk_wishlist_user_event (user_id, event_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notifications (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id     BIGINT       NOT NULL,
    type        VARCHAR(50)  NOT NULL, -- BOOKING_CONFIRMATION | REMINDER | CANCELLATION | REFUND
    title       VARCHAR(200) NOT NULL,
    body        TEXT         NOT NULL,
    read_flag   BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notifications_user_read (user_id, read_flag)
) ENGINE=InnoDB;
