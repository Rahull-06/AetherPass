import { api } from "@/services/api";

export type CouponOffer = {
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "FLAT" | string;
  discountValue: number;
  minOrderAmount: number;
  estimatedDiscount: number;
  eligible: boolean;
  reason?: string | null;
};

export const couponService = {
  offers(subtotal: number) {
    return api
      .get<CouponOffer[]>("/coupons/offers", {
        params: { subtotal },
      })
      .then((r) => r.data);
  },
};
