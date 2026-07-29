package com.aetherpass.config;

import com.aetherpass.entity.Event;
import com.aetherpass.entity.Organizer;
import com.aetherpass.entity.TicketCategory;
import com.aetherpass.entity.Venue;
import com.aetherpass.repository.EventRepository;
import com.aetherpass.repository.OrganizerRepository;
import com.aetherpass.repository.VenueRepository;
import com.aetherpass.service.EventService;
import com.aetherpass.service.SeatMapService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Dev-only demo catalog so /events is never empty after a fresh DB.
 */
@Component
@Profile("dev")
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DevCatalogSeeder implements ApplicationRunner {

    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository;
    private final VenueRepository venueRepository;
    private final SeatMapService seatMapService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (eventRepository.count() > 0) {
            return;
        }

        Organizer organizer = organizerRepository.findByUserEmail("organizer@livearena.in").orElse(null);
        List<Venue> venues = venueRepository.findAll();
        if (organizer == null || venues.isEmpty()) {
            log.warn("Dev catalog seed skipped — organizer/venues missing. Run database seed SQL first.");
            return;
        }

        Instant now = Instant.now();
        seedEvent(
                organizer,
                venues.get(0),
                "Neon Nights Live",
                "neon-nights-live",
                "MUSIC",
                "An open-air night of synth and skyline — limited early bird rows.",
                now.plus(12, ChronoUnit.DAYS),
                now.plus(12, ChronoUnit.DAYS).plus(3, ChronoUnit.HOURS),
                new BigDecimal("1499"),
                new BigDecimal("3499")
        );
        seedEvent(
                organizer,
                venues.size() > 1 ? venues.get(1) : venues.get(0),
                "Standup Under the Stars",
                "standup-under-the-stars",
                "COMEDY",
                "Three headliners. One lawn. Bring your friends and your loudest laugh.",
                now.plus(20, ChronoUnit.DAYS),
                now.plus(20, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS),
                new BigDecimal("799"),
                new BigDecimal("1599")
        );
        seedEvent(
                organizer,
                venues.size() > 2 ? venues.get(2) : venues.get(0),
                "City Marathon Kickoff",
                "city-marathon-kickoff",
                "SPORTS",
                "Cheer zone tickets for the downtown kickoff concert and athlete parade.",
                now.plus(30, ChronoUnit.DAYS),
                now.plus(30, ChronoUnit.DAYS).plus(5, ChronoUnit.HOURS),
                new BigDecimal("499"),
                new BigDecimal("999")
        );

        log.info("Dev catalog seeded with {} published events", eventRepository.count());
    }

    private void seedEvent(
            Organizer organizer,
            Venue venue,
            String title,
            String slug,
            String category,
            String description,
            Instant startsAt,
            Instant endsAt,
            BigDecimal regular,
            BigDecimal vip
    ) {
        Event event = Event.builder()
                .organizer(organizer)
                .venue(venue)
                .title(title)
                .slug(slug)
                .category(category)
                .description(description)
                .bannerUrl(null)
                .startsAt(startsAt)
                .endsAt(endsAt)
                .status(EventService.STATUS_PUBLISHED)
                .build();

        event.getTicketCategories().add(TicketCategory.builder()
                .event(event)
                .name("Regular")
                .description("Standard seating")
                .price(regular)
                .currency("INR")
                .totalSeats(40)
                .build());
        event.getTicketCategories().add(TicketCategory.builder()
                .event(event)
                .name("VIP")
                .description("Front rows + lounge access")
                .price(vip)
                .currency("INR")
                .totalSeats(20)
                .build());

        Event saved = eventRepository.save(event);
        seatMapService.ensureSeatsForEvent(saved);
    }
}
