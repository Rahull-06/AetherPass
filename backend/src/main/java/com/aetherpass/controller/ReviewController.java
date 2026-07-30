package com.aetherpass.controller;

import com.aetherpass.dto.request.CreateReviewRequest;
import com.aetherpass.dto.response.ReviewResponse;
import com.aetherpass.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/v1/events/{eventId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<List<ReviewResponse>> list(@PathVariable Long eventId) {
        return ResponseEntity.ok(reviewService.forEvent(eventId));
    }

    @PostMapping
    public ResponseEntity<ReviewResponse> upsert(
            Authentication authentication,
            @PathVariable Long eventId,
            @Valid @RequestBody CreateReviewRequest request
    ) {
        return ResponseEntity.ok(reviewService.upsert(authentication.getName(), eventId, request));
    }
}
