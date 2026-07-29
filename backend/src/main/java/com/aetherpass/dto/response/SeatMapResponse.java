package com.aetherpass.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeatMapResponse {

    private Long eventId;
    private String eventTitle;
    private String eventSlug;
    private long lockTtlSeconds;
    private List<SeatCell> seats;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatCell {
        private Long id;
        private String rowLabel;
        private String seatNumber;
        private String label; // A12
        private Long categoryId;
        private String categoryName;
        private BigDecimal price;
        private String currency;
        /** AVAILABLE | LOCKED | BOOKED | BLOCKED | MINE */
        private String state;
    }
}
