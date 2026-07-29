package com.aetherpass.controller;

import com.aetherpass.dto.request.CreateEventRequest;
import com.aetherpass.dto.request.UpdateEventRequest;
import com.aetherpass.dto.response.EventDetailResponse;
import com.aetherpass.dto.response.EventSummaryResponse;
import com.aetherpass.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organizer/events")
@RequiredArgsConstructor
public class OrganizerEventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<List<EventSummaryResponse>> mine(Authentication authentication) {
        return ResponseEntity.ok(eventService.listMine(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventDetailResponse> one(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(eventService.getMineById(authentication.getName(), id));
    }

    @PostMapping
    public ResponseEntity<EventDetailResponse> create(
            Authentication authentication,
            @Valid @RequestBody CreateEventRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(eventService.create(authentication.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EventDetailResponse> update(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody UpdateEventRequest request
    ) {
        return ResponseEntity.ok(eventService.update(authentication.getName(), id, request));
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<EventDetailResponse> submit(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(eventService.submit(authentication.getName(), id));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<EventDetailResponse> cancel(
            Authentication authentication,
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(eventService.cancel(authentication.getName(), id));
    }
}
