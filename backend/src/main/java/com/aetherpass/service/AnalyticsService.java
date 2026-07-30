package com.aetherpass.service;

import com.aetherpass.dto.response.AnalyticsResponse;
import com.aetherpass.repository.BookingRepository;
import com.aetherpass.repository.EventRepository;
import com.aetherpass.repository.PaymentRepository;
import com.aetherpass.repository.TicketRepository;
import com.aetherpass.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;
    private final TicketRepository ticketRepository;
    private final PaymentRepository paymentRepository;

    public AnalyticsResponse platformOverview() {
        BigDecimal revenue = paymentRepository.sumPaidAmount();
        if (revenue == null) {
            revenue = BigDecimal.ZERO;
        }

        List<AnalyticsResponse.PopularEvent> popular = new ArrayList<>();
        for (Object[] row : ticketRepository.findPopularEvents(PageRequest.of(0, 5))) {
            Long eventId = (Long) row[0];
            BigDecimal eventRevenue = paymentRepository.sumPaidByEventId(eventId);
            popular.add(AnalyticsResponse.PopularEvent.builder()
                    .eventId(eventId)
                    .title((String) row[1])
                    .slug((String) row[2])
                    .ticketsSold((Long) row[3])
                    .revenue(eventRevenue == null ? BigDecimal.ZERO : eventRevenue)
                    .build());
        }

        return AnalyticsResponse.builder()
                .totalUsers(userRepository.count())
                .totalEvents(eventRepository.count())
                .publishedEvents(eventRepository.countByStatus("PUBLISHED"))
                .ticketsSold(ticketRepository.countSoldTickets())
                .confirmedBookings(bookingRepository.countByStatus("CONFIRMED"))
                .totalRevenue(revenue)
                .popularEvents(popular)
                .build();
    }
}
