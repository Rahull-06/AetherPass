package com.aetherpass.controller;

import com.aetherpass.dto.request.ScanTicketRequest;
import com.aetherpass.dto.response.ScanTicketResponse;
import com.aetherpass.service.TicketScanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/organizer/scan")
@RequiredArgsConstructor
public class OrganizerScanController {

    private final TicketScanService ticketScanService;

    @PostMapping
    public ResponseEntity<ScanTicketResponse> scan(
            Authentication authentication,
            @Valid @RequestBody ScanTicketRequest request
    ) {
        return ResponseEntity.ok(ticketScanService.scan(authentication.getName(), request));
    }
}
