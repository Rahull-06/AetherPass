package com.aetherpass.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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
public class UpdateCouponRequest {

    @Size(max = 255)
    private String description;

    @Pattern(regexp = "PERCENT|FLAT", message = "discountType must be PERCENT or FLAT")
    private String discountType;

    @DecimalMin(value = "0.01", message = "discountValue must be positive")
    private BigDecimal discountValue;

    @DecimalMin(value = "0.00", message = "minOrderAmount cannot be negative")
    private BigDecimal minOrderAmount;

    private Integer maxUses;

    private Instant validFrom;

    private Instant validUntil;

    private Boolean active;
}
