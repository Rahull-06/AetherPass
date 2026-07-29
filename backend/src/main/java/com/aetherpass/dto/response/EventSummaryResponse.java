package com.aetherpass.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSummaryResponse {

    private Long id;
    private String title;
    private String slug;
    private String category;
    private String bannerUrl;
    private Instant startsAt;
    private Instant endsAt;
    private String status;
    private String city;
    private String venueName;
    private BigDecimal minPrice;
    private String currency;
}
