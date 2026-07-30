package com.aetherpass.controller;

import com.aetherpass.dto.response.EventSummaryResponse;
import com.aetherpass.service.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<EventSummaryResponse>> mine(Authentication authentication) {
        return ResponseEntity.ok(wishlistService.mine(authentication.getName()));
    }

    @PostMapping("/{eventId}")
    public ResponseEntity<Map<String, Boolean>> add(
            Authentication authentication,
            @PathVariable Long eventId
    ) {
        wishlistService.add(authentication.getName(), eventId);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("saved", true));
    }

    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> remove(Authentication authentication, @PathVariable Long eventId) {
        wishlistService.remove(authentication.getName(), eventId);
        return ResponseEntity.noContent().build();
    }
}
