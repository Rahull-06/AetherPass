package com.aetherpass.service;

import com.aetherpass.dto.response.EventDetailResponse;
import com.aetherpass.dto.response.EventSummaryResponse;
import com.aetherpass.dto.response.PageResponse;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Locale;
import java.util.Optional;

/**
 * Redis cache for hot public catalog reads (browse + detail).
 * Evicted when events are published / unpublished so listings stay fresh.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EventCacheService {

    private static final String BROWSE_PREFIX = "aether:events:browse:";
    private static final String DETAIL_PREFIX = "aether:events:detail:";
    private static final String CATALOG_VERSION_KEY = "aether:events:catalog:v";

    private final StringRedisTemplate redis;
    private final ObjectMapper objectMapper;

    @Value("${aetherpass.cache.event-browse-ttl-seconds:60}")
    private long browseTtlSeconds;

    @Value("${aetherpass.cache.event-detail-ttl-seconds:300}")
    private long detailTtlSeconds;

    public Optional<PageResponse<EventSummaryResponse>> getBrowse(
            String q,
            String category,
            String city,
            int page,
            int size
    ) {
        return read(browseKey(q, category, city, page, size), new TypeReference<>() {});
    }

    public void putBrowse(
            String q,
            String category,
            String city,
            int page,
            int size,
            PageResponse<EventSummaryResponse> payload
    ) {
        write(browseKey(q, category, city, page, size), payload, Duration.ofSeconds(browseTtlSeconds));
    }

    public Optional<EventDetailResponse> getDetail(String slug) {
        return read(DETAIL_PREFIX + slug.toLowerCase(Locale.ROOT), new TypeReference<>() {});
    }

    public void putDetail(String slug, EventDetailResponse payload) {
        // Never cache per-user wishlist state.
        EventDetailResponse copy = cloneDetail(payload);
        if (copy != null) {
            copy.setWishlisted(false);
            write(DETAIL_PREFIX + slug.toLowerCase(Locale.ROOT), copy, Duration.ofSeconds(detailTtlSeconds));
        }
    }

    public void evictCatalog() {
        try {
            redis.opsForValue().increment(CATALOG_VERSION_KEY);
            // Detail keys still expire via TTL; bump version invalidates browse keys.
            log.debug("Event catalog cache version bumped");
        } catch (Exception ex) {
            log.warn("Failed to bump event catalog cache version: {}", ex.getMessage());
        }
    }

    public void evictDetail(String slug) {
        if (slug == null || slug.isBlank()) {
            return;
        }
        try {
            redis.delete(DETAIL_PREFIX + slug.toLowerCase(Locale.ROOT));
        } catch (Exception ex) {
            log.warn("Failed to evict event detail cache for {}: {}", slug, ex.getMessage());
        }
    }

    private String browseKey(String q, String category, String city, int page, int size) {
        String version = Optional.ofNullable(redis.opsForValue().get(CATALOG_VERSION_KEY)).orElse("0");
        return BROWSE_PREFIX + version + ":"
                + n(q) + "|" + n(category) + "|" + n(city) + "|" + page + "|" + size;
    }

    private String n(String value) {
        return value == null || value.isBlank() ? "_" : value.trim().toLowerCase(Locale.ROOT);
    }

    private <T> Optional<T> read(String key, TypeReference<T> type) {
        try {
            String json = redis.opsForValue().get(key);
            if (json == null || json.isBlank()) {
                return Optional.empty();
            }
            return Optional.ofNullable(objectMapper.readValue(json, type));
        } catch (Exception ex) {
            log.warn("Event cache read miss/error for {}: {}", key, ex.getMessage());
            return Optional.empty();
        }
    }

    private void write(String key, Object value, Duration ttl) {
        try {
            redis.opsForValue().set(key, objectMapper.writeValueAsString(value), ttl);
        } catch (Exception ex) {
            log.warn("Event cache write failed for {}: {}", key, ex.getMessage());
        }
    }

    private EventDetailResponse cloneDetail(EventDetailResponse source) {
        try {
            return objectMapper.readValue(objectMapper.writeValueAsString(source), EventDetailResponse.class);
        } catch (Exception ex) {
            return null;
        }
    }
}
