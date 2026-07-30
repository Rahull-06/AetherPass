package com.aetherpass.service;

import com.aetherpass.dto.request.CreateEventRequest;
import com.aetherpass.dto.request.UpdateEventRequest;
import com.aetherpass.dto.response.EventDetailResponse;
import com.aetherpass.dto.response.EventSummaryResponse;
import com.aetherpass.dto.response.PageResponse;
import com.aetherpass.entity.Event;
import com.aetherpass.entity.Organizer;
import com.aetherpass.entity.TicketCategory;
import com.aetherpass.entity.Venue;
import com.aetherpass.exception.ApiException;
import com.aetherpass.mapper.EventMapper;
import com.aetherpass.repository.EventRepository;
import com.aetherpass.repository.OrganizerRepository;
import com.aetherpass.repository.ReviewRepository;
import com.aetherpass.repository.VenueRepository;
import com.aetherpass.util.SlugUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Catalog flow:
 * public browse -> PUBLISHED only
 * organizer create -> DRAFT + categories
 * organizer submit -> PENDING_APPROVAL
 * admin approve -> PUBLISHED / reject -> DRAFT
 */
@Service
@RequiredArgsConstructor
@Transactional
public class EventService {

    public static final String STATUS_DRAFT = "DRAFT";
    public static final String STATUS_PENDING = "PENDING_APPROVAL";
    public static final String STATUS_PUBLISHED = "PUBLISHED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    private static final Set<String> CATEGORIES = Set.of(
            "MUSIC", "COMEDY", "SPORTS", "THEATRE", "FESTIVAL", "WORKSHOP"
    );

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final OrganizerRepository organizerRepository;
    private final EventMapper eventMapper;
    private final SeatMapService seatMapService;
    private final ReviewRepository reviewRepository;
    private final WishlistService wishlistService;
    private final EventCacheService eventCacheService;

    @Transactional(readOnly = true)
    public PageResponse<EventSummaryResponse> browse(
            String q,
            String category,
            String city,
            int page,
            int size
    ) {
        String normalizedCategory = blankToNull(category);
        if (normalizedCategory != null) {
            normalizedCategory = normalizedCategory.toUpperCase(Locale.ROOT);
            if (!CATEGORIES.contains(normalizedCategory)) {
                throw new ApiException("Invalid category", HttpStatus.BAD_REQUEST, "INVALID_CATEGORY");
            }
        }
        final String categoryFilter = normalizedCategory;

        String qNorm = blankToNull(q);
        String cityNorm = blankToNull(city);
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 40);

        return eventCacheService.getBrowse(qNorm, categoryFilter, cityNorm, safePage, safeSize)
                .orElseGet(() -> {
                    Page<Event> result = eventRepository.searchPublished(
                            STATUS_PUBLISHED,
                            qNorm,
                            categoryFilter,
                            cityNorm,
                            PageRequest.of(safePage, safeSize)
                    );

                    PageResponse<EventSummaryResponse> payload = PageResponse.<EventSummaryResponse>builder()
                            .content(result.getContent().stream().map(eventMapper::toSummary).toList())
                            .page(result.getNumber())
                            .size(result.getSize())
                            .totalElements(result.getTotalElements())
                            .totalPages(result.getTotalPages())
                            .build();
                    eventCacheService.putBrowse(qNorm, categoryFilter, cityNorm, safePage, safeSize, payload);
                    return payload;
                });
    }

    @Transactional(readOnly = true)
    public EventDetailResponse getPublishedBySlug(String slug, String viewerEmail) {
        EventDetailResponse detail = eventCacheService.getDetail(slug).orElseGet(() -> {
            Event event = eventRepository.findDetailedBySlug(slug)
                    .orElseThrow(() -> new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));

            if (!STATUS_PUBLISHED.equals(event.getStatus())) {
                throw new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND");
            }
            EventDetailResponse fresh = eventMapper.toDetail(event);
            Double avg = reviewRepository.averageRating(event.getId());
            fresh.setAverageRating(avg == null ? 0.0 : Math.round(avg * 10.0) / 10.0);
            fresh.setReviewCount(reviewRepository.countByEventId(event.getId()));
            eventCacheService.putDetail(slug, fresh);
            return fresh;
        });

        detail.setWishlisted(wishlistService.isSaved(viewerEmail, detail.getId()));
        return detail;
    }

    @Transactional(readOnly = true)
    public List<EventSummaryResponse> listMine(String organizerEmail) {
        Organizer organizer = requireOrganizer(organizerEmail);
        return eventRepository.findByOrganizerIdOrderByStartsAtDesc(organizer.getId()).stream()
                .map(eventMapper::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public EventDetailResponse getMineById(String organizerEmail, Long id) {
        Event event = requireOwnedEvent(organizerEmail, id);
        return eventMapper.toDetail(event);
    }

    public EventDetailResponse create(String organizerEmail, CreateEventRequest request) {
        validateWindow(request.getStartsAt(), request.getEndsAt());
        validateCategory(request.getCategory());
        validateCategoryNames(request);

        Organizer organizer = requireOrganizer(organizerEmail);
        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ApiException("Venue not found", HttpStatus.NOT_FOUND, "VENUE_NOT_FOUND"));

        Event event = Event.builder()
                .organizer(organizer)
                .venue(venue)
                .title(request.getTitle().trim())
                .slug(uniqueSlug(request.getTitle()))
                .description(request.getDescription())
                .category(request.getCategory().toUpperCase(Locale.ROOT))
                .bannerUrl(blankToNull(request.getBannerUrl()))
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .status(STATUS_DRAFT)
                .build();

        for (CreateEventRequest.TicketCategoryRequest tc : request.getTicketCategories()) {
            TicketCategory category = TicketCategory.builder()
                    .event(event)
                    .name(tc.getName().trim())
                    .description(tc.getDescription())
                    .price(tc.getPrice())
                    .currency("INR")
                    .totalSeats(tc.getTotalSeats())
                    .build();
            event.getTicketCategories().add(category);
        }

        return eventMapper.toDetail(eventRepository.save(event));
    }

    public EventDetailResponse update(String organizerEmail, Long id, UpdateEventRequest request) {
        Event event = requireOwnedEvent(organizerEmail, id);
        if (!STATUS_DRAFT.equals(event.getStatus())) {
            throw new ApiException("Only draft events can be edited", HttpStatus.CONFLICT, "EVENT_NOT_EDITABLE");
        }

        validateWindow(request.getStartsAt(), request.getEndsAt());
        validateCategory(request.getCategory());

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ApiException("Venue not found", HttpStatus.NOT_FOUND, "VENUE_NOT_FOUND"));

        event.setTitle(request.getTitle().trim());
        event.setDescription(request.getDescription());
        event.setCategory(request.getCategory().toUpperCase(Locale.ROOT));
        event.setBannerUrl(blankToNull(request.getBannerUrl()));
        event.setVenue(venue);
        event.setStartsAt(request.getStartsAt());
        event.setEndsAt(request.getEndsAt());

        return eventMapper.toDetail(eventRepository.save(event));
    }

    public EventDetailResponse submit(String organizerEmail, Long id) {
        Event event = requireOwnedEvent(organizerEmail, id);
        if (!STATUS_DRAFT.equals(event.getStatus())) {
            throw new ApiException("Only draft events can be submitted", HttpStatus.CONFLICT, "INVALID_STATUS");
        }
        if (event.getTicketCategories() == null || event.getTicketCategories().isEmpty()) {
            throw new ApiException("Add at least one ticket category", HttpStatus.BAD_REQUEST, "MISSING_CATEGORIES");
        }
        event.setStatus(STATUS_PENDING);
        return eventMapper.toDetail(eventRepository.save(event));
    }

    public EventDetailResponse cancel(String organizerEmail, Long id) {
        Event event = requireOwnedEvent(organizerEmail, id);
        if (STATUS_CANCELLED.equals(event.getStatus())) {
            return eventMapper.toDetail(event);
        }
        event.setStatus(STATUS_CANCELLED);
        Event saved = eventRepository.save(event);
        eventCacheService.evictCatalog();
        eventCacheService.evictDetail(saved.getSlug());
        return eventMapper.toDetail(saved);
    }

    @Transactional(readOnly = true)
    public List<EventSummaryResponse> listPending() {
        return eventRepository.findByStatusOrderByStartsAtAsc(STATUS_PENDING).stream()
                .map(eventMapper::toSummary)
                .toList();
    }

    public EventDetailResponse approve(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (!STATUS_PENDING.equals(event.getStatus())) {
            throw new ApiException("Only pending events can be approved", HttpStatus.CONFLICT, "INVALID_STATUS");
        }
        event.setStatus(STATUS_PUBLISHED);
        Event saved = eventRepository.save(event);
        seatMapService.ensureSeatsForEvent(saved);
        eventCacheService.evictCatalog();
        eventCacheService.evictDetail(saved.getSlug());
        return eventMapper.toDetail(saved);
    }

    public EventDetailResponse reject(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (!STATUS_PENDING.equals(event.getStatus())) {
            throw new ApiException("Only pending events can be rejected", HttpStatus.CONFLICT, "INVALID_STATUS");
        }
        event.setStatus(STATUS_DRAFT);
        Event saved = eventRepository.save(event);
        eventCacheService.evictCatalog();
        eventCacheService.evictDetail(saved.getSlug());
        return eventMapper.toDetail(saved);
    }

    private Event requireOwnedEvent(String organizerEmail, Long id) {
        Organizer organizer = requireOrganizer(organizerEmail);
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ApiException("Event not found", HttpStatus.NOT_FOUND, "EVENT_NOT_FOUND"));
        if (!event.getOrganizer().getId().equals(organizer.getId())) {
            throw new ApiException("You do not own this event", HttpStatus.FORBIDDEN, "EVENT_FORBIDDEN");
        }
        return event;
    }

    private Organizer requireOrganizer(String email) {
        return organizerRepository.findByUserEmail(email)
                .orElseThrow(() -> new ApiException(
                        "Organizer profile not found for this account",
                        HttpStatus.FORBIDDEN,
                        "ORGANIZER_REQUIRED"
                ));
    }

    private String uniqueSlug(String title) {
        String base = SlugUtil.slugify(title);
        String candidate = base;
        int i = 2;
        while (eventRepository.existsBySlug(candidate)) {
            candidate = base + "-" + i++;
        }
        return candidate;
    }

    private void validateWindow(java.time.Instant startsAt, java.time.Instant endsAt) {
        if (!endsAt.isAfter(startsAt)) {
            throw new ApiException("endsAt must be after startsAt", HttpStatus.BAD_REQUEST, "INVALID_TIME_WINDOW");
        }
    }

    private void validateCategory(String category) {
        if (category == null || !CATEGORIES.contains(category.toUpperCase(Locale.ROOT))) {
            throw new ApiException("Invalid category", HttpStatus.BAD_REQUEST, "INVALID_CATEGORY");
        }
    }

    private void validateCategoryNames(CreateEventRequest request) {
        Set<String> names = new HashSet<>();
        for (CreateEventRequest.TicketCategoryRequest tc : request.getTicketCategories()) {
            String key = tc.getName().trim().toLowerCase(Locale.ROOT);
            if (!names.add(key)) {
                throw new ApiException("Duplicate ticket category name", HttpStatus.BAD_REQUEST, "DUPLICATE_CATEGORY");
            }
        }
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
