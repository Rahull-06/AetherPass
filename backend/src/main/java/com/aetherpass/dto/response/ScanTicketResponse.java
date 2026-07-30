package com.aetherpass.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScanTicketResponse {

    private boolean valid;
    private String message;
    private String ticketCode;
    private String ticketStatus;
    private String seatLabel;
    private String bookingCode;
    private String eventTitle;
    private String holderName;
    private Instant usedAt;
}
