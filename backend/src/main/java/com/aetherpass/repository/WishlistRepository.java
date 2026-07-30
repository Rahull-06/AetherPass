package com.aetherpass.repository;

import com.aetherpass.entity.Wishlist;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    boolean existsByUserIdAndEventId(Long userId, Long eventId);

    Optional<Wishlist> findByUserIdAndEventId(Long userId, Long eventId);

    @EntityGraph(attributePaths = {"event", "event.venue", "event.ticketCategories"})
    List<Wishlist> findByUserIdOrderByCreatedAtDesc(Long userId);

    void deleteByUserIdAndEventId(Long userId, Long eventId);
}
