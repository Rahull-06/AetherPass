package com.aetherpass.mapper;

import com.aetherpass.dto.response.EventDetailResponse;
import com.aetherpass.dto.response.EventSummaryResponse;
import com.aetherpass.dto.response.VenueResponse;
import com.aetherpass.entity.Event;
import com.aetherpass.entity.TicketCategory;
import com.aetherpass.entity.Venue;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;

@Component
public class EventMapper {

    public EventSummaryResponse toSummary(Event event) {
        TicketCategory cheapest = event.getTicketCategories() == null
                ? null
                : event.getTicketCategories().stream()
                .min(Comparator.comparing(TicketCategory::getPrice))
                .orElse(null);

        return EventSummaryResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .slug(event.getSlug())
                .category(event.getCategory())
                .bannerUrl(event.getBannerUrl())
                .startsAt(event.getStartsAt())
                .endsAt(event.getEndsAt())
                .status(event.getStatus())
                .city(event.getVenue() != null ? event.getVenue().getCity() : null)
                .venueName(event.getVenue() != null ? event.getVenue().getName() : null)
                .minPrice(cheapest != null ? cheapest.getPrice() : BigDecimal.ZERO)
                .currency(cheapest != null ? cheapest.getCurrency() : "INR")
                .build();
    }

    public EventDetailResponse toDetail(Event event) {
        Venue venue = event.getVenue();
        List<EventDetailResponse.TicketCategoryResponse> categories = event.getTicketCategories() == null
                ? List.of()
                : event.getTicketCategories().stream()
                .map(tc -> EventDetailResponse.TicketCategoryResponse.builder()
                        .id(tc.getId())
                        .name(tc.getName())
                        .description(tc.getDescription())
                        .price(tc.getPrice())
                        .currency(tc.getCurrency())
                        .totalSeats(tc.getTotalSeats())
                        .build())
                .toList();

        return EventDetailResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .slug(event.getSlug())
                .description(event.getDescription())
                .category(event.getCategory())
                .bannerUrl(event.getBannerUrl())
                .startsAt(event.getStartsAt())
                .endsAt(event.getEndsAt())
                .status(event.getStatus())
                .organizerCompany(event.getOrganizer() != null ? event.getOrganizer().getCompanyName() : null)
                .venue(venue == null ? null : EventDetailResponse.VenueResponse.builder()
                        .id(venue.getId())
                        .name(venue.getName())
                        .addressLine(venue.getAddressLine())
                        .city(venue.getCity())
                        .state(venue.getState())
                        .country(venue.getCountry())
                        .capacity(venue.getCapacity())
                        .build())
                .ticketCategories(categories)
                .build();
    }

    public VenueResponse toVenue(Venue venue) {
        return VenueResponse.builder()
                .id(venue.getId())
                .name(venue.getName())
                .addressLine(venue.getAddressLine())
                .city(venue.getCity())
                .state(venue.getState())
                .country(venue.getCountry())
                .capacity(venue.getCapacity())
                .build();
    }
}
