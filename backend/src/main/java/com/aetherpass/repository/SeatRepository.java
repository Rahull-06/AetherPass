package com.aetherpass.repository;

import com.aetherpass.entity.Seat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    List<Seat> findByEventIdOrderByRowLabelAscSeatNumberAsc(Long eventId);

    long countByEventId(Long eventId);

    @Query("""
            SELECT s FROM Seat s
            JOIN FETCH s.ticketCategory
            WHERE s.event.id = :eventId
            ORDER BY s.rowLabel ASC, s.seatNumber ASC
            """)
    List<Seat> findDetailedByEventId(@Param("eventId") Long eventId);

    @Query("""
            SELECT s FROM Seat s
            JOIN FETCH s.ticketCategory
            JOIN FETCH s.event
            WHERE s.id IN :ids
            """)
    List<Seat> findDetailedByIdIn(@Param("ids") Collection<Long> ids);

    List<Seat> findByIdIn(Collection<Long> ids);
}
