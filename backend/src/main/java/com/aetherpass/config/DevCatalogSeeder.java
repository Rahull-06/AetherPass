package com.aetherpass.config;

import com.aetherpass.entity.Event;
import com.aetherpass.entity.Organizer;
import com.aetherpass.entity.TicketCategory;
import com.aetherpass.entity.Venue;
import com.aetherpass.repository.EventRepository;
import com.aetherpass.repository.OrganizerRepository;
import com.aetherpass.repository.VenueRepository;
import com.aetherpass.service.EventCacheService;
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
 * Ensures banners stay valid and affordable shows exist even on existing DBs.
 */
@Component
@Profile("dev")
@Order(2)
@RequiredArgsConstructor
@Slf4j
public class DevCatalogSeeder implements ApplicationRunner {

    // Verified Unsplash URLs (200 OK). Avoid stale IDs that 404.
    private static final String BANNER_MUSIC =
            "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=80";
    private static final String BANNER_COMEDY =
            "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1600&q=80";
    private static final String BANNER_SPORTS =
            "https://images.unsplash.com/photo-1530549387789-4c1017266635?auto=format&fit=crop&w=1600&q=80";
    private static final String BANNER_ACOUSTIC =
            "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80";
    private static final String BANNER_CINEMA =
            "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=80";
    private static final String BANNER_DANCE =
            "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1600&q=80";

    private final EventRepository eventRepository;
    private final OrganizerRepository organizerRepository;
    private final VenueRepository venueRepository;
    private final SeatMapService seatMapService;
    private final EventCacheService eventCacheService;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Organizer organizer = organizerRepository.findByUserEmail("organizer@livearena.in").orElse(null);
        List<Venue> venues = venueRepository.findAll();
        if (organizer == null || venues.isEmpty()) {
            log.warn("Dev catalog seed skipped — organizer/venues missing. Run database seed SQL first.");
            return;
        }

        Instant now = Instant.now();
        Venue v0 = venues.get(0);
        Venue v1 = venues.size() > 1 ? venues.get(1) : v0;
        Venue v2 = venues.size() > 2 ? venues.get(2) : v0;
        Venue hyd = venues.stream()
                .filter(v -> "Hyderabad".equalsIgnoreCase(v.getCity()))
                .findFirst()
                .orElse(v0);
        Venue hydAlt = venues.stream()
                .filter(v -> "Hyderabad".equalsIgnoreCase(v.getCity()) && !v.getId().equals(hyd.getId()))
                .findFirst()
                .orElse(hyd);

        boolean changed = false;

        changed |= ensureEvent(
                organizer, v0,
                "Neon Nights Live", "neon-nights-live", "MUSIC",
                "An open-air night of synth and skyline — limited early bird rows.",
                now.plus(12, ChronoUnit.DAYS), 3,
                "1499", "3499", BANNER_MUSIC
        );
        changed |= ensureEvent(
                organizer, v1,
                "Standup Under the Stars", "standup-under-the-stars", "COMEDY",
                "Three headliners. One lawn. Bring your friends and your loudest laugh.",
                now.plus(20, ChronoUnit.DAYS), 2,
                "799", "1599", BANNER_COMEDY
        );
        changed |= ensureEvent(
                organizer, v2,
                "City Marathon Kickoff", "city-marathon-kickoff", "SPORTS",
                "Cheer zone tickets for the downtown kickoff concert and athlete parade.",
                now.plus(30, ChronoUnit.DAYS), 5,
                "499", "999", BANNER_SPORTS
        );
        changed |= ensureEvent(
                organizer, v1,
                "Acoustic Café Night", "acoustic-cafe-night", "MUSIC",
                "Intimate singer-songwriter sets with tea, soft lights, and floor cushions.",
                now.plus(8, ChronoUnit.DAYS), 2,
                "299", "699", BANNER_ACOUSTIC
        );
        changed |= ensureEvent(
                organizer, v0,
                "Indie Film Evening", "indie-film-evening", "THEATRE",
                "Two short films + a director Q&A. Affordable seats for film lovers.",
                now.plus(15, ChronoUnit.DAYS), 3,
                "249", "549", BANNER_CINEMA
        );
        changed |= ensureEvent(
                organizer, v2,
                "Open Floor Dance Social", "open-floor-dance-social", "FESTIVAL",
                "Beginner-friendly social dance night — no partner needed, just good shoes.",
                now.plus(18, ChronoUnit.DAYS), 4,
                "199", "499", BANNER_DANCE
        );
        changed |= ensureEvent(
                organizer, hyd,
                "Hyderabad Jazz After Dark", "hyderabad-jazz-after-dark", "MUSIC",
                "Smooth jazz under Hitex lights — weekend hangout for the city.",
                now.plus(10, ChronoUnit.DAYS), 3,
                "399", "899", BANNER_MUSIC
        );
        changed |= ensureEvent(
                organizer, hydAlt,
                "Tollywood Laugh Riot", "tollywood-laugh-riot", "COMEDY",
                "Telugu + Hindi standup specials at Shilpakala Vedika.",
                now.plus(22, ChronoUnit.DAYS), 2,
                "349", "799", BANNER_COMEDY
        );

        changed |= syncBanner("neon-nights-live", BANNER_MUSIC);
        changed |= syncBanner("standup-under-the-stars", BANNER_COMEDY);
        changed |= syncBanner("city-marathon-kickoff", BANNER_SPORTS);
        changed |= syncBanner("acoustic-cafe-night", BANNER_ACOUSTIC);
        changed |= syncBanner("indie-film-evening", BANNER_CINEMA);
        changed |= syncBanner("open-floor-dance-social", BANNER_DANCE);
        changed |= syncBanner("hyderabad-jazz-after-dark", BANNER_MUSIC);
        changed |= syncBanner("tollywood-laugh-riot", BANNER_COMEDY);

        if (changed) {
            eventCacheService.evictCatalog();
            for (String slug : List.of(
                    "neon-nights-live",
                    "standup-under-the-stars",
                    "city-marathon-kickoff",
                    "acoustic-cafe-night",
                    "indie-film-evening",
                    "open-floor-dance-social",
                    "hyderabad-jazz-after-dark",
                    "tollywood-laugh-riot"
            )) {
                eventCacheService.evictDetail(slug);
            }
            log.info("Dev catalog ready with {} published events", eventRepository.count());
        }
    }

    private boolean ensureEvent(
            Organizer organizer,
            Venue venue,
            String title,
            String slug,
            String category,
            String description,
            Instant startsAt,
            int durationHours,
            String regular,
            String vip,
            String bannerUrl
    ) {
        if (eventRepository.existsBySlug(slug)) {
            return false;
        }
        seedEvent(
                organizer,
                venue,
                title,
                slug,
                category,
                description,
                startsAt,
                startsAt.plus(durationHours, ChronoUnit.HOURS),
                new BigDecimal(regular),
                new BigDecimal(vip),
                bannerUrl
        );
        return true;
    }

    private boolean syncBanner(String slug, String bannerUrl) {
        var event = eventRepository.findBySlug(slug).orElse(null);
        if (event == null) {
            return false;
        }
        if (bannerUrl.equals(event.getBannerUrl())) {
            return false;
        }
        event.setBannerUrl(bannerUrl);
        eventRepository.save(event);
        return true;
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
            BigDecimal vip,
            String bannerUrl
    ) {
        Event event = Event.builder()
                .organizer(organizer)
                .venue(venue)
                .title(title)
                .slug(slug)
                .category(category)
                .description(description)
                .bannerUrl(bannerUrl)
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
                .totalSeats(80)
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
