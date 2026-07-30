package com.aetherpass.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventDetailResponse {

    private Long id;
    private String title;
    private String slug;
    private String description;
    private String category;
    private String bannerUrl;
    private Instant startsAt;
    private Instant endsAt;
    private String status;
    private VenueResponse venue;
    private String organizerCompany;
    private Double averageRating;
    private Long reviewCount;
    private Boolean wishlisted;
    private List<TicketCategoryResponse> ticketCategories;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VenueResponse {
        private Long id;
        private String name;
        private String addressLine;
        private String city;
        private String state;
        private String country;
        private Integer capacity;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketCategoryResponse {
        private Long id;
        private String name;
        private String description;
        private BigDecimal price;
        private String currency;
        private Integer totalSeats;
    }
}
