package com.aetherpass.repository;

import com.aetherpass.entity.Ticket;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("""
            SELECT t FROM Ticket t
            JOIN FETCH t.seat s
            LEFT JOIN FETCH s.ticketCategory
            WHERE t.booking.id = :bookingId
            ORDER BY t.id
            """)
    List<Ticket> findDetailedByBookingId(@Param("bookingId") Long bookingId);

    @Query("""
            SELECT t FROM Ticket t
            JOIN FETCH t.booking b
            JOIN FETCH b.user
            JOIN FETCH b.event e
            JOIN FETCH e.organizer
            JOIN FETCH t.seat
            WHERE t.ticketCode = :ticketCode
            """)
    Optional<Ticket> findDetailedByTicketCode(@Param("ticketCode") String ticketCode);

    @Query("""
            SELECT COUNT(t) FROM Ticket t
            WHERE t.booking.status = 'CONFIRMED'
              AND t.status IN ('VALID', 'USED')
            """)
    long countSoldTickets();

    @Query("""
            SELECT e.id, e.title, e.slug, COUNT(t)
            FROM Ticket t
            JOIN t.booking b
            JOIN b.event e
            WHERE b.status = 'CONFIRMED'
              AND t.status IN ('VALID', 'USED')
            GROUP BY e.id, e.title, e.slug
            ORDER BY COUNT(t) DESC
            """)
    List<Object[]> findPopularEvents(Pageable pageable);
}
