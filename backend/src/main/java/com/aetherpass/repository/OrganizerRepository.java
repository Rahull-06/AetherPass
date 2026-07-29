package com.aetherpass.repository;

import com.aetherpass.entity.Organizer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OrganizerRepository extends JpaRepository<Organizer, Long> {

    Optional<Organizer> findByUserEmail(String email);

    Optional<Organizer> findByUserId(Long userId);
}
