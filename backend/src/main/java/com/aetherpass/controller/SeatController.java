package com.aetherpass.controller;

import com.aetherpass.dto.response.SeatMapResponse;
import com.aetherpass.service.BookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class SeatController {

    private final BookingService bookingService;

    @GetMapping("/{slug}/seats")
    public ResponseEntity<SeatMapResponse> seats(
            @PathVariable String slug,
            Authentication authentication
    ) {
        String email = null;
        if (authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            email = authentication.getName();
        }
        return ResponseEntity.ok(bookingService.getSeatMap(slug, email));
    }
}
