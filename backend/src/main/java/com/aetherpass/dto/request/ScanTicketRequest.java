package com.aetherpass.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScanTicketRequest {

    /** Full QR payload or ticket code (TKT-XXXXXXXX). */
    @NotBlank
    private String qrPayload;
}
