package com.aetherpass.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CreateEventRequest {

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 5000)
    private String description;

    @NotBlank
    private String category;

    @Size(max = 500)
    private String bannerUrl;

    @NotNull
    private Long venueId;

    @NotNull
    private Instant startsAt;

    @NotNull
    private Instant endsAt;

    @NotEmpty
    @Valid
    private List<TicketCategoryRequest> ticketCategories;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TicketCategoryRequest {

        @NotBlank
        @Size(max = 100)
        private String name;

        @Size(max = 255)
        private String description;

        @NotNull
        @DecimalMin("0.0")
        private BigDecimal price;

        @NotNull
        @Min(1)
        private Integer totalSeats;
    }
}
