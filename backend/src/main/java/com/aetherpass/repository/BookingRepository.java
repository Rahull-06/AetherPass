package com.aetherpass.repository;

import com.aetherpass.entity.Booking;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Seats only in the graph — joining tickets in the same MultiBag fetch
     * duplicates bag elements (cartesian product).
     */
    @EntityGraph(attributePaths = {
            "event", "seats", "seats.ticketCategory", "user"
    })
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {
            "event", "event.venue", "user",
            "seats", "seats.ticketCategory"
    })
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    Optional<Booking> findDetailedById(@Param("id") Long id);

    @Query("""
            SELECT b FROM Booking b
            WHERE b.status = :status
              AND b.expiresAt IS NOT NULL
              AND b.expiresAt < :now
            """)
    List<Booking> findExpiredPending(@Param("status") String status, @Param("now") Instant now);

    boolean existsByBookingCode(String bookingCode);
}
