package com.aetherpass.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

import org.springframework.data.redis.core.StringRedisTemplate;
import lombok.RequiredArgsConstructor;

/**
 * Health check endpoint — confirms API is up before auth/modules land.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class HealthController {

    private final StringRedisTemplate redis;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        String redisStatus = "UP";
        try {
            // Touch Redis to prevent Upstash from pausing the free database after 14 days of inactivity
            redis.opsForValue().get("health:ping");
        } catch (Exception ex) {
            redisStatus = "DOWN";
        }

        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "redis_status", redisStatus,
                "service", "AetherPass",
                "timestamp", Instant.now().toString()
        ));
    }
}
