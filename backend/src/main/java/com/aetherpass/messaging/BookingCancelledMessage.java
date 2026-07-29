package com.aetherpass.messaging;

import java.io.Serializable;

public record BookingCancelledMessage(
        Long bookingId,
        String bookingCode,
        Long userId,
        String userEmail,
        String userName,
        String eventTitle,
        String status
) implements Serializable {
}
