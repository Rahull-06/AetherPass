package com.aetherpass.service;

import com.aetherpass.dto.request.CreateCouponRequest;
import com.aetherpass.dto.request.UpdateCouponRequest;
import com.aetherpass.dto.response.CouponOfferResponse;
import com.aetherpass.dto.response.CouponResponse;
import com.aetherpass.entity.Coupon;
import com.aetherpass.exception.ApiException;
import com.aetherpass.repository.CouponRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CouponService {

    private final CouponRepository couponRepository;

    @Transactional(readOnly = true)
    public Coupon requireValid(String code) {
        Coupon coupon = couponRepository.findByCodeIgnoreCase(code.trim())
                .orElseThrow(() -> new ApiException("Invalid coupon code", HttpStatus.BAD_REQUEST, "COUPON_INVALID"));
        Instant now = Instant.now();
        if (!coupon.isActive()
                || now.isBefore(coupon.getValidFrom())
                || now.isAfter(coupon.getValidUntil())) {
            throw new ApiException("Coupon is expired or inactive", HttpStatus.BAD_REQUEST, "COUPON_INACTIVE");
        }
        if (coupon.getMaxUses() != null && coupon.getUsedCount() != null
                && coupon.getUsedCount() >= coupon.getMaxUses()) {
            throw new ApiException("Coupon usage limit reached", HttpStatus.BAD_REQUEST, "COUPON_EXHAUSTED");
        }
        return coupon;
    }

    public void requireMinOrder(Coupon coupon, BigDecimal subtotal) {
        BigDecimal min = coupon.getMinOrderAmount() == null ? BigDecimal.ZERO : coupon.getMinOrderAmount();
        if (subtotal == null || subtotal.compareTo(min) < 0) {
            throw new ApiException(
                    "Add more tickets — this coupon needs at least Rs." + min.toPlainString(),
                    HttpStatus.BAD_REQUEST,
                    "COUPON_MIN_ORDER"
            );
        }
    }

    public BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        if (subtotal == null || subtotal.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal discount;
        if ("PERCENT".equalsIgnoreCase(coupon.getDiscountType())) {
            discount = subtotal.multiply(coupon.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        } else {
            discount = coupon.getDiscountValue();
        }
        if (discount.compareTo(subtotal) > 0) {
            discount = subtotal;
        }
        return discount.setScale(2, RoundingMode.HALF_UP);
    }

    public void markUsed(Coupon coupon) {
        int used = coupon.getUsedCount() == null ? 0 : coupon.getUsedCount();
        coupon.setUsedCount(used + 1);
        couponRepository.save(coupon);
    }

    @Transactional(readOnly = true)
    public List<CouponOfferResponse> listOffers(BigDecimal subtotal) {
        BigDecimal cart = subtotal == null ? BigDecimal.ZERO : subtotal;
        Instant now = Instant.now();

        return couponRepository.findAll(Sort.by(Sort.Direction.ASC, "code")).stream()
                .filter(Coupon::isActive)
                .filter(c -> !now.isBefore(c.getValidFrom()) && !now.isAfter(c.getValidUntil()))
                .filter(c -> c.getMaxUses() == null
                        || c.getUsedCount() == null
                        || c.getUsedCount() < c.getMaxUses())
                .map(c -> toOffer(c, cart))
                .sorted(Comparator
                        .comparing(CouponOfferResponse::isEligible).reversed()
                        .thenComparing(CouponOfferResponse::getEstimatedDiscount,
                                Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CouponResponse> listAll() {
        return couponRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt")).stream()
                .map(this::toResponse)
                .toList();
    }

    public CouponResponse create(CreateCouponRequest request) {
        String code = request.getCode().trim().toUpperCase();
        if (couponRepository.findByCodeIgnoreCase(code).isPresent()) {
            throw new ApiException("Coupon code already exists", HttpStatus.CONFLICT, "COUPON_EXISTS");
        }
        validateDiscount(request.getDiscountType(), request.getDiscountValue());
        if (!request.getValidUntil().isAfter(request.getValidFrom())) {
            throw new ApiException("validUntil must be after validFrom", HttpStatus.BAD_REQUEST, "INVALID_DATES");
        }
        if (request.getMaxUses() != null && request.getMaxUses() < 1) {
            throw new ApiException("maxUses must be at least 1", HttpStatus.BAD_REQUEST, "INVALID_MAX_USES");
        }

        BigDecimal minOrder = request.getMinOrderAmount() == null
                ? BigDecimal.ZERO
                : request.getMinOrderAmount().max(BigDecimal.ZERO);

        Coupon coupon = Coupon.builder()
                .code(code)
                .description(blankToNull(request.getDescription()))
                .discountType(request.getDiscountType().trim().toUpperCase())
                .discountValue(request.getDiscountValue().setScale(2, RoundingMode.HALF_UP))
                .minOrderAmount(minOrder.setScale(2, RoundingMode.HALF_UP))
                .maxUses(request.getMaxUses())
                .usedCount(0)
                .validFrom(request.getValidFrom())
                .validUntil(request.getValidUntil())
                .active(request.getActive() == null || request.getActive())
                .build();

        return toResponse(couponRepository.save(coupon));
    }

    public CouponResponse update(Long id, UpdateCouponRequest request) {
        Coupon coupon = couponRepository.findById(id)
                .orElseThrow(() -> new ApiException("Coupon not found", HttpStatus.NOT_FOUND, "COUPON_NOT_FOUND"));

        if (request.getDescription() != null) {
            coupon.setDescription(blankToNull(request.getDescription()));
        }
        if (request.getDiscountType() != null) {
            coupon.setDiscountType(request.getDiscountType().trim().toUpperCase());
        }
        if (request.getDiscountValue() != null) {
            coupon.setDiscountValue(request.getDiscountValue().setScale(2, RoundingMode.HALF_UP));
        }
        validateDiscount(coupon.getDiscountType(), coupon.getDiscountValue());

        if (request.getMinOrderAmount() != null) {
            coupon.setMinOrderAmount(request.getMinOrderAmount().max(BigDecimal.ZERO)
                    .setScale(2, RoundingMode.HALF_UP));
        }
        if (request.getMaxUses() != null) {
            if (request.getMaxUses() < 1) {
                throw new ApiException("maxUses must be at least 1", HttpStatus.BAD_REQUEST, "INVALID_MAX_USES");
            }
            coupon.setMaxUses(request.getMaxUses());
        }
        if (request.getValidFrom() != null) {
            coupon.setValidFrom(request.getValidFrom());
        }
        if (request.getValidUntil() != null) {
            coupon.setValidUntil(request.getValidUntil());
        }
        if (!coupon.getValidUntil().isAfter(coupon.getValidFrom())) {
            throw new ApiException("validUntil must be after validFrom", HttpStatus.BAD_REQUEST, "INVALID_DATES");
        }
        if (request.getActive() != null) {
            coupon.setActive(request.getActive());
        }

        return toResponse(couponRepository.save(coupon));
    }

    private CouponOfferResponse toOffer(Coupon coupon, BigDecimal subtotal) {
        BigDecimal min = coupon.getMinOrderAmount() == null ? BigDecimal.ZERO : coupon.getMinOrderAmount();
        boolean eligible = subtotal.compareTo(min) >= 0;
        BigDecimal estimated = eligible ? calculateDiscount(coupon, subtotal) : BigDecimal.ZERO;
        String reason = eligible
                ? null
                : "Needs cart of " + formatRs(min) + "+";

        return CouponOfferResponse.builder()
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minOrderAmount(min)
                .estimatedDiscount(estimated)
                .eligible(eligible)
                .reason(reason)
                .build();
    }

    private String formatRs(BigDecimal amount) {
        return "Rs." + amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private void validateDiscount(String type, BigDecimal value) {
        if ("PERCENT".equalsIgnoreCase(type) && value.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new ApiException("Percent discount cannot exceed 100", HttpStatus.BAD_REQUEST, "INVALID_DISCOUNT");
        }
    }

    private CouponResponse toResponse(Coupon coupon) {
        return CouponResponse.builder()
                .id(coupon.getId())
                .code(coupon.getCode())
                .description(coupon.getDescription())
                .discountType(coupon.getDiscountType())
                .discountValue(coupon.getDiscountValue())
                .minOrderAmount(coupon.getMinOrderAmount() == null ? BigDecimal.ZERO : coupon.getMinOrderAmount())
                .maxUses(coupon.getMaxUses())
                .usedCount(coupon.getUsedCount())
                .validFrom(coupon.getValidFrom())
                .validUntil(coupon.getValidUntil())
                .active(coupon.isActive())
                .createdAt(coupon.getCreatedAt())
                .build();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
