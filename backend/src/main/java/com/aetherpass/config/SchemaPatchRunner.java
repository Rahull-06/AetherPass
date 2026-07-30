package com.aetherpass.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Lightweight schema patches for local/demo DBs without Flyway.
 * Must never fail app startup on cloud (missing defaults / partial schema).
 */
@Component
@Order(0)
@RequiredArgsConstructor
@Slf4j
public class SchemaPatchRunner implements ApplicationRunner {

    private final JdbcTemplate jdbc;

    @Override
    public void run(ApplicationArguments args) {
        try {
            ensureTimestampDefaults();
            ensureCouponMinOrderColumn();
            patchCouponCatalog();
            ensureHyderabadVenues();
        } catch (Exception ex) {
            log.warn("Schema patch skipped (non-fatal): {}", ex.getMessage());
        }
    }

    /**
     * Hibernate ddl-auto=update often creates created_at/updated_at as NOT NULL
     * without DEFAULT, which breaks inserts that rely on DB defaults.
     */
    private void ensureTimestampDefaults() {
        String[] createdOnly = {
                "roles", "coupons", "refresh_tokens", "password_reset_tokens",
                "wishlist", "notifications"
        };
        for (String table : createdOnly) {
            alterCreatedAt(table);
        }

        String[] createdAndUpdated = {
                "users", "organizers", "venues", "events", "ticket_categories",
                "seats", "bookings", "tickets", "payments", "reviews"
        };
        for (String table : createdAndUpdated) {
            alterCreatedAt(table);
            alterUpdatedAt(table);
        }
    }

    private void alterCreatedAt(String table) {
        if (!tableExists(table) || !columnExists(table, "created_at")) {
            return;
        }
        try {
            jdbc.execute(
                    "ALTER TABLE `" + table + "` MODIFY COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
            );
        } catch (Exception ex) {
            log.debug("created_at default skip {}: {}", table, ex.getMessage());
        }
    }

    private void alterUpdatedAt(String table) {
        if (!tableExists(table) || !columnExists(table, "updated_at")) {
            return;
        }
        try {
            jdbc.execute(
                    "ALTER TABLE `" + table + "` MODIFY COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
            );
        } catch (Exception ex) {
            log.debug("updated_at default skip {}: {}", table, ex.getMessage());
        }
    }

    private boolean tableExists(String table) {
        Integer count = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM information_schema.TABLES
                        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?
                        """,
                Integer.class,
                table
        );
        return count != null && count > 0;
    }

    private boolean columnExists(String table, String column) {
        Integer count = jdbc.queryForObject(
                """
                        SELECT COUNT(*) FROM information_schema.COLUMNS
                        WHERE TABLE_SCHEMA = DATABASE()
                          AND TABLE_NAME = ?
                          AND COLUMN_NAME = ?
                        """,
                Integer.class,
                table,
                column
        );
        return count != null && count > 0;
    }

    private void ensureCouponMinOrderColumn() {
        if (!tableExists("coupons") || columnExists("coupons", "min_order_amount")) {
            return;
        }
        jdbc.execute(
                "ALTER TABLE coupons ADD COLUMN min_order_amount DECIMAL(12, 2) NOT NULL DEFAULT 0 AFTER discount_value"
        );
        log.info("Added coupons.min_order_amount column");
    }

    private void patchCouponCatalog() {
        if (!tableExists("coupons")) {
            return;
        }
        jdbc.update("""
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
                    ELSE min_order_amount
                  END
                WHERE code IN ('WELCOME100', 'EARLYBIRD', 'FESTIVAL', 'STUDENT')
                """);

        Integer save10 = jdbc.queryForObject(
                "SELECT COUNT(*) FROM coupons WHERE code = 'SAVE10'",
                Integer.class
        );
        if (save10 != null && save10 == 0) {
            jdbc.update("""
                    INSERT INTO coupons
                      (code, description, discount_type, discount_value, min_order_amount,
                       max_uses, used_count, valid_from, valid_until, active, created_at)
                    VALUES
                      ('SAVE10', '10% off on Rs.1000+', 'PERCENT', 10.00, 1000.00,
                       10000, 0, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, NOW())
                    """);
            log.info("Seeded SAVE10 coupon");
        }
    }

    private void ensureHyderabadVenues() {
        if (!tableExists("venues")) {
            return;
        }
        ensureVenue(
                "Hitex Exhibition Centre",
                "HITEX, Madhapur",
                "Hyderabad",
                "Telangana",
                "500081",
                6000
        );
        ensureVenue(
                "Shilpakala Vedika",
                "Madhapur",
                "Hyderabad",
                "Telangana",
                "500081",
                2500
        );
    }

    private void ensureVenue(
            String name,
            String address,
            String city,
            String state,
            String pincode,
            int capacity
    ) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM venues WHERE name = ? AND city = ?",
                Integer.class,
                name,
                city
        );
        if (count != null && count > 0) {
            return;
        }
        jdbc.update(
                """
                        INSERT INTO venues
                          (name, address_line, city, state, country, pincode, capacity, created_at, updated_at)
                        VALUES (?, ?, ?, ?, 'India', ?, ?, NOW(), NOW())
                        """,
                name,
                address,
                city,
                state,
                pincode,
                capacity
        );
        log.info("Added venue {} ({})", name, city);
    }
}
