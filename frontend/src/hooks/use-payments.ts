"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/services/payment.service";
import type { VerifyPaymentPayload } from "@/types/payment";

export function useCreatePaymentOrder() {
  return useMutation({
    mutationFn: (bookingId: number) => paymentService.createOrder(bookingId),
  });
}

export function useVerifyPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VerifyPaymentPayload) => paymentService.verify(payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      void qc.invalidateQueries({ queryKey: ["bookings", data.id] });
      void qc.invalidateQueries({ queryKey: ["seats"] });
    },
  });
}

export function useMockPay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => paymentService.mockComplete(bookingId),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      void qc.invalidateQueries({ queryKey: ["bookings", data.id] });
      void qc.invalidateQueries({ queryKey: ["seats"] });
    },
  });
}
