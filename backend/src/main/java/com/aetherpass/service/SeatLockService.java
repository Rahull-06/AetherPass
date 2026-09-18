package com.aetherpass.service;

import com.aetherpass.exception.ApiException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Redis seat locks (5 minutes by default).
 * Key: seat-lock:{seatId} -> userId:bookingRef
 * Why Redis: fast, auto-expiry, works across API instances.
 */
@Service
@RequiredArgsConstructor
public class SeatLockService {

    private final StringRedisTemplate redis;

    @Value("${aetherpass.seat-lock.ttl-seconds:300}")
    private long ttlSeconds;

    private static final String LOCK_SCRIPT = 
            "for i = 1, #KEYS do " +
            "  if redis.call('EXISTS', KEYS[i]) == 1 then " +
            "    return 0 " +
            "  end " +
            "end " +
            "for i = 1, #KEYS do " +
            "  redis.call('SET', KEYS[i], ARGV[1], 'EX', ARGV[2]) " +
            "end " +
            "return 1 ";

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
     * Atomically lock all seats for this user/booking. Rolls back if any seat is taken.
     */
    public void lockSeats(Long userId, String bookingRef, List<Long> seatIds) {
        if (seatIds == null || seatIds.isEmpty()) return;
        
        String payload = userId + ":" + (bookingRef != null ? bookingRef : "PENDING");
        List<String> keys = seatIds.stream().map(this::key).collect(Collectors.toList());

        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(LOCK_SCRIPT);
        script.setResultType(Long.class);

        Long result = redis.execute(script, keys, payload, String.valueOf(ttlSeconds));

        if (result == null || result == 0L) {
            throw new ApiException(
                    "One or more seats are already taken. Please pick other seats.",
                    HttpStatus.CONFLICT,
                    "SEAT_LOCKED"
            );
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
