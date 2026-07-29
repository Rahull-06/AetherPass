package com.aetherpass.controller;

import com.aetherpass.dto.request.CreatePaymentOrderRequest;
import com.aetherpass.dto.request.VerifyPaymentRequest;
import com.aetherpass.dto.response.BookingResponse;
import com.aetherpass.dto.response.PaymentOrderResponse;
import com.aetherpass.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<PaymentOrderResponse> createOrder(
            Authentication authentication,
            @Valid @RequestBody CreatePaymentOrderRequest request
    ) {
        return ResponseEntity.ok(paymentService.createOrder(authentication.getName(), request));
    }

    @PostMapping("/verify")
    public ResponseEntity<BookingResponse> verify(
            Authentication authentication,
            @Valid @RequestBody VerifyPaymentRequest request
    ) {
        return ResponseEntity.ok(paymentService.verify(authentication.getName(), request));
    }

    /** One-click demo checkout when aetherpass.payments.provider=MOCK. */
    @PostMapping("/mock-complete/{bookingId}")
    public ResponseEntity<BookingResponse> mockComplete(
            Authentication authentication,
            @PathVariable Long bookingId
    ) {
        return ResponseEntity.ok(paymentService.mockComplete(authentication.getName(), bookingId));
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature
    ) {
        paymentService.handleWebhook(payload, signature == null ? "" : signature);
        return ResponseEntity.ok().build();
    }
}
