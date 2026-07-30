package com.aetherpass.controller;

import com.aetherpass.dto.response.EventDetailResponse;
import com.aetherpass.dto.response.EventSummaryResponse;
import com.aetherpass.dto.response.PageResponse;
import com.aetherpass.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping
    public ResponseEntity<PageResponse<EventSummaryResponse>> browse(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String city,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(eventService.browse(q, category, city, page, size));
    }

    @GetMapping("/{slug}")
    public ResponseEntity<EventDetailResponse> detail(
            @PathVariable String slug,
            Authentication authentication
    ) {
        String email = null;
        if (authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken)) {
            email = authentication.getName();
        }
        return ResponseEntity.ok(eventService.getPublishedBySlug(slug, email));
    }
}
