package com.aetherpass.controller;

import com.aetherpass.dto.response.CouponOfferResponse;
import com.aetherpass.service.CouponService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/coupons")
@RequiredArgsConstructor
public class CouponController {

    private final CouponService couponService;

    /**
     * Checkout helper: returns active coupons with eligibility for a cart subtotal.
     */
    @GetMapping("/offers")
    public ResponseEntity<List<CouponOfferResponse>> offers(
            @RequestParam BigDecimal subtotal
    ) {
        return ResponseEntity.ok(couponService.listOffers(subtotal));
    }
}
