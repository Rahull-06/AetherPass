package com.aetherpass.controller;

import com.aetherpass.dto.request.ApplyCouponRequest;
import com.aetherpass.dto.request.HoldSeatsRequest;
import com.aetherpass.dto.response.BookingResponse;
import com.aetherpass.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/hold")
    public ResponseEntity<BookingResponse> hold(
            Authentication authentication,
            @Valid @RequestBody HoldSeatsRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.holdSeats(authentication.getName(), request));
    }

    @PostMapping("/{id}/coupon")
    public ResponseEntity<BookingResponse> applyCoupon(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody ApplyCouponRequest request
    ) {
        return ResponseEntity.ok(bookingService.applyCoupon(authentication.getName(), id, request));
    }

    @PostMapping("/{id}/coupon/remove")
    public ResponseEntity<BookingResponse> removeCoupon(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingService.removeCoupon(authentication.getName(), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<BookingResponse> cancel(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingService.cancel(authentication.getName(), id));
    }

    @GetMapping("/me")
    public ResponseEntity<List<BookingResponse>> mine(Authentication authentication) {
        return ResponseEntity.ok(bookingService.myBookings(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BookingResponse> one(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(bookingService.getMine(authentication.getName(), id));
    }
}
