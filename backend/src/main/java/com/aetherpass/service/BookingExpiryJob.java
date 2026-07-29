package com.aetherpass.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class BookingExpiryJob {

    private final BookingService bookingService;

    /** Every 30s: free seats when the 5-minute hold ends. */
    @Scheduled(fixedDelayString = "30000")
    public void releaseExpiredHolds() {
        bookingService.expireOverdueBookings();
    }
}
