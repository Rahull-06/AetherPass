"use client";

import { useQuery } from "@tanstack/react-query";
import { couponService } from "@/services/coupon.service";

export function useCouponOffers(subtotal: number, enabled: boolean) {
  return useQuery({
    queryKey: ["coupons", "offers", subtotal],
    queryFn: () => couponService.offers(subtotal),
    enabled: enabled && subtotal >= 0,
    staleTime: 30_000,
  });
}
