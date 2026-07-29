package com.aetherpass.controller;

import com.aetherpass.dto.response.NotificationResponse;
import com.aetherpass.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/me")
    public ResponseEntity<List<NotificationResponse>> mine(Authentication authentication) {
        return ResponseEntity.ok(notificationService.mine(authentication.getName()));
    }

    @GetMapping("/me/unread-count")
    public ResponseEntity<Map<String, Long>> unread(Authentication authentication) {
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(authentication.getName())));
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markRead(Authentication authentication, @PathVariable Long id) {
        notificationService.markRead(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/me/read-all")
    public ResponseEntity<Void> markAll(Authentication authentication) {
        notificationService.markAllRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
