package com.aetherpass.service;

import com.aetherpass.dto.response.EventSummaryResponse;
import com.aetherpass.entity.Event;
import com.aetherpass.entity.User;
import com.aetherpass.entity.Wishlist;
import com.aetherpass.exception.ApiException;
import com.aetherpass.mapper.EventMapper;
import com.aetherpass.repository.EventRepository;
import com.aetherpass.repository.UserRepository;
import com.aetherpass.repository.WishlistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class WishlistService {

    private final WishlistRepository wishlistRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    public void add(String email, Long eventId) {
        User user = requireUser(email);
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (!"PUBLISHED".equals(event.getStatus())) {
            throw new ApiException("Only live events can be saved", HttpStatus.CONFLICT, "EVENT_NOT_LIVE");
        }
        if (wishlistRepository.existsByUserIdAndEventId(user.getId(), eventId)) {
            return;
        }
        wishlistRepository.save(Wishlist.builder().user(user).event(event).build());
    }

    public void remove(String email, Long eventId) {
        User user = requireUser(email);
        wishlistRepository.deleteByUserIdAndEventId(user.getId(), eventId);
    }

    @Transactional(readOnly = true)
    public List<EventSummaryResponse> mine(String email) {
        User user = requireUser(email);
        return wishlistRepository.findByUserIdOrderByCreatedAtDesc(user.getId()).stream()
                .map(w -> eventMapper.toSummary(w.getEvent()))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isSaved(String email, Long eventId) {
        if (email == null) return false;
        return userRepository.findByEmail(email.trim().toLowerCase())
                .map(u -> wishlistRepository.existsByUserIdAndEventId(u.getId(), eventId))
                .orElse(false);
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
    }
}
