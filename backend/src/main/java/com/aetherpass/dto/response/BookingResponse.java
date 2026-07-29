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
public class BookingResponse {

    private Long id;
    private String bookingCode;
    private String status;
    private Long eventId;
    private String eventTitle;
    private String eventSlug;
    private Instant startsAt;
    private BigDecimal subtotal;
    private BigDecimal discountAmount;
    private BigDecimal totalAmount;
    private String currency;
    private Instant expiresAt;
    private Instant createdAt;
    private List<SeatInfo> seats;
    private List<TicketInfo> tickets;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SeatInfo {
        private Long id;
        private String label;
        private String categoryName;
        private BigDecimal price;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketInfo {
        private Long id;
        private String ticketCode;
        private String qrPayload;
        private String status;
        private String seatLabel;
    }
}
