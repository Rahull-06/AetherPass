package com.aetherpass.repository;

import com.aetherpass.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    Optional<Event> findBySlug(String slug);

    boolean existsBySlug(String slug);

    @EntityGraph(attributePaths = {"venue", "ticketCategories", "organizer"})
    @Query("SELECT e FROM Event e WHERE e.slug = :slug")
    Optional<Event> findDetailedBySlug(@Param("slug") String slug);

    @EntityGraph(attributePaths = {"venue", "ticketCategories"})
    List<Event> findByOrganizerIdOrderByStartsAtDesc(Long organizerId);

    @EntityGraph(attributePaths = {"venue", "ticketCategories", "organizer"})
    List<Event> findByStatusOrderByStartsAtAsc(String status);

    long countByStatus(String status);

    @EntityGraph(attributePaths = {"venue", "ticketCategories"})
    @Query("""
            SELECT DISTINCT e FROM Event e
            JOIN e.venue v
            WHERE e.status = :status
              AND (:category IS NULL OR e.category = :category)
              AND (:city IS NULL OR LOWER(v.city) = LOWER(:city))
              AND (
                    :q IS NULL
                    OR LOWER(e.title) LIKE LOWER(CONCAT('%', :q, '%'))
                    OR LOWER(COALESCE(e.description, '')) LIKE LOWER(CONCAT('%', :q, '%'))
                  )
            ORDER BY e.startsAt ASC
            """)
    Page<Event> searchPublished(
            @Param("status") String status,
            @Param("q") String q,
            @Param("category") String category,
            @Param("city") String city,
            Pageable pageable
    );
}
