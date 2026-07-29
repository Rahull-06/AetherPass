package com.aetherpass.controller;

import com.aetherpass.dto.response.EventDetailResponse;
import com.aetherpass.dto.response.EventSummaryResponse;
import com.aetherpass.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/events")
@RequiredArgsConstructor
public class AdminEventController {

    private final EventService eventService;

    @GetMapping("/pending")
    public ResponseEntity<List<EventSummaryResponse>> pending() {
        return ResponseEntity.ok(eventService.listPending());
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<EventDetailResponse> approve(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.approve(id));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<EventDetailResponse> reject(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.reject(id));
    }
}
