package com.aetherpass.config;

import com.aetherpass.entity.Organizer;
import com.aetherpass.entity.Role;
import com.aetherpass.entity.User;
import com.aetherpass.repository.OrganizerRepository;
import com.aetherpass.repository.RoleRepository;
import com.aetherpass.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

/**
 * Ensures demo accounts always login with Password@123 in local/dev.
 * Fixes bad seed bcrypt hashes already written into MySQL volumes.
 */
@Component
@Profile("dev")
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DevAccountSeeder implements ApplicationRunner {

    public static final String DEMO_PASSWORD = "Password@123";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final OrganizerRepository organizerRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role userRole = ensureRole("ROLE_USER", "Regular ticket buyer");
        Role organizerRole = ensureRole("ROLE_ORGANIZER", "Event organizer");
        Role adminRole = ensureRole("ROLE_ADMIN", "Platform administrator");

        User admin = upsertUser(
                "admin@aetherpass.dev",
                "Aether Admin",
                "9000000001",
                adminRole
        );
        User organizer = upsertUser(
                "organizer@livearena.in",
                "Riya Sharma",
                "9000000002",
                organizerRole
        );
        upsertUser(
                "user@example.com",
                "Arjun Mehta",
                "9000000003",
                userRole
        );

        if (organizerRepository.findByUserId(organizer.getId()).isEmpty()) {
            organizerRepository.save(Organizer.builder()
                    .user(organizer)
                    .companyName("Live Arena Productions")
                    .gstin("27AABCU9603R1ZM")
                    .verified(true)
                    .build());
        }

        log.info("Dev demo accounts ready (password: {}). Admin id={}, organizer id={}",
                DEMO_PASSWORD, admin.getId(), organizer.getId());
    }

    private Role ensureRole(String name, String description) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }

    private User upsertUser(String email, String fullName, String phone, Role role) {
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            user = User.builder()
                    .email(email)
                    .fullName(fullName)
                    .phone(phone)
                    .status("ACTIVE")
                    .emailVerified(true)
                    .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                    .roles(new HashSet<>(Set.of(role)))
                    .build();
            return userRepository.save(user);
        }

        user.setFullName(fullName);
        user.setPhone(phone);
        user.setStatus("ACTIVE");
        user.setEmailVerified(true);
        user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));

        // Mutate Hibernate's managed collection — never replace with Set.of(...)
        if (user.getRoles() == null) {
            user.setRoles(new HashSet<>());
        } else {
            user.getRoles().clear();
        }
        user.getRoles().add(role);

        return userRepository.save(user);
    }
}
