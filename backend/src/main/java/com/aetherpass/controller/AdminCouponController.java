package com.aetherpass.controller;

import com.aetherpass.dto.request.CreateCouponRequest;
import com.aetherpass.dto.request.UpdateCouponRequest;
import com.aetherpass.dto.response.CouponResponse;
import com.aetherpass.service.CouponService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/coupons")
@RequiredArgsConstructor
public class AdminCouponController {

    private final CouponService couponService;

    @GetMapping
    public ResponseEntity<List<CouponResponse>> list() {
        return ResponseEntity.ok(couponService.listAll());
    }

    @PostMapping
    public ResponseEntity<CouponResponse> create(@Valid @RequestBody CreateCouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponService.create(request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<CouponResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCouponRequest request
    ) {
        return ResponseEntity.ok(couponService.update(id, request));
    }
}
