package com.aetherpass.service;

import com.aetherpass.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Redis seat locks (5 minutes by default).
 * Key: seat-lock:{seatId} -> userId:bookingId
 * Why Redis: fast, auto-expiry, works across API instances.
 */
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final StringRedisTemplate redis;

    @Value("${aetherpass.seat-lock.ttl-seconds:300}")
    private long ttlSeconds;

    private String key(Long seatId) {
        return "seat-lock:" + seatId;
    }

    public long ttlSeconds() {
        return ttlSeconds;
    }

    public boolean isLocked(Long seatId) {
        Boolean exists = redis.hasKey(key(seatId));
        return Boolean.TRUE.equals(exists);
    }

    public Long lockedByUserId(Long seatId) {
        String value = redis.opsForValue().get(key(seatId));
        if (value == null) {
            return null;
        }
        String[] parts = value.split(":");
        return Long.parseLong(parts[0]);
    }

    /**
     * Try to lock all seats for this user/booking. Rolls back if any seat is taken.
     */
    public void lockSeats(Long userId, Long bookingId, List<Long> seatIds) {
        List<Long> locked = new ArrayList<>();
        String payload = userId + ":" + bookingId;
        Duration ttl = Duration.ofSeconds(ttlSeconds);

        try {
            for (Long seatId : seatIds) {
                Boolean ok = redis.opsForValue().setIfAbsent(key(seatId), payload, ttl);
                if (!Boolean.TRUE.equals(ok)) {
                    throw new ApiException(
                            "Seat just got taken. Pick another.",
                            HttpStatus.CONFLICT,
                            "SEAT_LOCKED"
                    );
                }
                locked.add(seatId);
            }
        } catch (RuntimeException ex) {
            releaseSeats(locked);
            throw ex;
        }
    }

    public void releaseSeats(List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) {
            return;
        }
        Set<String> keys = new HashSet<>();
        for (Long id : seatIds) {
            keys.add(key(id));
        }
        redis.delete(keys);
    }

    public void releaseSeats(Set<Long> seatIds) {
        releaseSeats(seatIds == null ? List.of() : seatIds.stream().toList());
    }
}
