package com.aetherpass.service;

import com.aetherpass.entity.Event;
import com.aetherpass.entity.Seat;
import com.aetherpass.entity.TicketCategory;
import com.aetherpass.repository.SeatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Builds a simple venue map from ticket_category.total_seats.
 * Example: 40 seats -> 4 rows × 10 seats (A1..D10).
 */
@Service
@RequiredArgsConstructor
public class SeatMapService {

    private static final int SEATS_PER_ROW = 10;

    private final SeatRepository seatRepository;

    @Transactional
    public void ensureSeatsForEvent(Event event) {
        if (seatRepository.countByEventId(event.getId()) > 0) {
            return;
        }
        if (event.getTicketCategories() == null || event.getTicketCategories().isEmpty()) {
            return;
        }

        List<Seat> seats = new ArrayList<>();
        int rowIndex = 0;

        for (TicketCategory category : event.getTicketCategories()) {
            int total = category.getTotalSeats() == null ? 0 : category.getTotalSeats();
            for (int i = 0; i < total; i++) {
                if (i % SEATS_PER_ROW == 0) {
                    rowIndex++;
                }
                String rowLabel = toRowLabel(rowIndex);
                String seatNumber = String.valueOf((i % SEATS_PER_ROW) + 1);
                seats.add(Seat.builder()
                        .event(event)
                        .ticketCategory(category)
                        .rowLabel(rowLabel)
                        .seatNumber(seatNumber)
                        .status("AVAILABLE")
                        .build());
            }
        }

        seatRepository.saveAll(seats);
    }

    private String toRowLabel(int oneBasedIndex) {
        // 1 -> A, 27 -> AA
        StringBuilder sb = new StringBuilder();
        int n = oneBasedIndex;
        while (n > 0) {
            n--;
            sb.insert(0, (char) ('A' + (n % 26)));
            n /= 26;
        }
        return sb.toString();
    }
}
