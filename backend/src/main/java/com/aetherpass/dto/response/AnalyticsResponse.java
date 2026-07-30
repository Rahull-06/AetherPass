package com.aetherpass.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnalyticsResponse {

    private long totalUsers;
    private long totalEvents;
    private long publishedEvents;
    private long ticketsSold;
    private long confirmedBookings;
    private BigDecimal totalRevenue;
    private List<PopularEvent> popularEvents;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PopularEvent {
        private Long eventId;
        private String title;
        private String slug;
        private long ticketsSold;
        private BigDecimal revenue;
    }
}
