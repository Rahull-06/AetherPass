-- Hold seats for a PENDING booking until payment/confirm (or expiry)
USE aetherpass;

CREATE TABLE IF NOT EXISTS booking_seats (
    booking_id  BIGINT NOT NULL,
    seat_id     BIGINT NOT NULL,
    PRIMARY KEY (booking_id, seat_id),
    CONSTRAINT fk_booking_seats_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
    CONSTRAINT fk_booking_seats_seat FOREIGN KEY (seat_id) REFERENCES seats(id),
    UNIQUE KEY uk_booking_seats_seat (seat_id)
) ENGINE=InnoDB;
