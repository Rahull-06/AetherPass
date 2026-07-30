package com.aetherpass.repository;

import com.aetherpass.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    List<Review> findByEventIdOrderByCreatedAtDesc(Long eventId);

    Optional<Review> findByUserIdAndEventId(Long userId, Long eventId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.event.id = :eventId")
    Double averageRating(@Param("eventId") Long eventId);

    long countByEventId(Long eventId);
}
