package com.aetherpass.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentOrderResponse {

    private Long paymentId;
    private Long bookingId;
    private String bookingCode;
    private String provider;
    private boolean mock;
    private String keyId;
    private String orderId;
    private BigDecimal amount;
    /** Amount in the smallest currency unit (paise for INR). */
    private long amountPaise;
    private String currency;
    private String customerName;
    private String customerEmail;
    private String customerPhone;
}
