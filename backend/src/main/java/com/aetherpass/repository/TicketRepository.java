package com.aetherpass.repository;

import com.aetherpass.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Query("""
            SELECT t FROM Ticket t
            JOIN FETCH t.seat s
            LEFT JOIN FETCH s.ticketCategory
            WHERE t.booking.id = :bookingId
            ORDER BY t.id
            """)
    List<Ticket> findDetailedByBookingId(@Param("bookingId") Long bookingId);
}
