package com.aetherpass.messaging;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;

/**
 * Payload published after a booking is confirmed (post-payment).
 */
public record BookingConfirmedMessage(
        Long bookingId,
        String bookingCode,
        Long userId,
        String userEmail,
        String userName,
        Long eventId,
        String eventTitle,
        String eventSlug,
        BigDecimal totalAmount,
        String currency,
        List<TicketLine> tickets
) implements Serializable {

    public record TicketLine(
            Long ticketId,
            String ticketCode,
            String seatLabel,
            String qrPayload
    ) implements Serializable {
    }
}
