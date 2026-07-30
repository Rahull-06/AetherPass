package com.aetherpass.repository;

import com.aetherpass.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @EntityGraph(attributePaths = "roles")
    @Query(
            value = """
                    SELECT DISTINCT u FROM User u
                    LEFT JOIN u.roles r
                    WHERE (:status IS NULL OR u.status = :status)
                      AND (:role IS NULL OR r.name = :role)
                      AND (
                            :q IS NULL
                            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
                            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
                          )
                    """,
            countQuery = """
                    SELECT COUNT(DISTINCT u) FROM User u
                    LEFT JOIN u.roles r
                    WHERE (:status IS NULL OR u.status = :status)
                      AND (:role IS NULL OR r.name = :role)
                      AND (
                            :q IS NULL
                            OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%'))
                            OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :q, '%'))
                          )
                    """
    )
    Page<User> searchAdmin(
            @Param("q") String q,
            @Param("role") String role,
            @Param("status") String status,
            Pageable pageable
    );
}

