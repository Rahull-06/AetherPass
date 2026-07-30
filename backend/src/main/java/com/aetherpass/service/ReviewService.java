package com.aetherpass.service;

import com.aetherpass.dto.request.CreateReviewRequest;
import com.aetherpass.dto.response.ReviewResponse;
import com.aetherpass.entity.Event;
import com.aetherpass.entity.Review;
import com.aetherpass.entity.User;
import com.aetherpass.exception.ApiException;
import com.aetherpass.repository.BookingRepository;
import com.aetherpass.repository.EventRepository;
import com.aetherpass.repository.ReviewRepository;
import com.aetherpass.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final BookingRepository bookingRepository;

    @Transactional(readOnly = true)
    public List<ReviewResponse> forEvent(Long eventId) {
        return reviewRepository.findByEventIdOrderByCreatedAtDesc(eventId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ReviewResponse upsert(String email, Long eventId, CreateReviewRequest request) {
        User user = userRepository.findByEmail(email.trim().toLowerCase())
                .orElseThrow(() -> new ApiException("User not found", HttpStatus.UNAUTHORIZED, "UNAUTHORIZED"));
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));

        boolean attended = bookingRepository.existsByUserIdAndEventIdAndStatus(user.getId(), eventId, "CONFIRMED");
        if (!attended) {
            throw new ApiException("Only confirmed ticket holders can review", HttpStatus.FORBIDDEN, "NO_BOOKING");
        }

        Review review = reviewRepository.findByUserIdAndEventId(user.getId(), eventId)
                .orElse(Review.builder().user(user).event(event).build());
        review.setRating(request.getRating());
        review.setComment(request.getComment() == null ? null : request.getComment().trim());
        return toResponse(reviewRepository.save(review));
    }

    private ReviewResponse toResponse(Review review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .eventId(review.getEvent().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .createdAt(review.getCreatedAt())
                .build();
    }
}
