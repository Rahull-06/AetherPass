"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingService } from "@/services/booking.service";

export function useSeatMap(slug: string) {
  return useQuery({
    queryKey: ["seats", slug],
    queryFn: () => bookingService.getSeatMap(slug),
    enabled: Boolean(slug),
    refetchInterval: 15_000,
  });
}

export function useMyBookings() {
  return useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => bookingService.myBookings(),
  });
}

export function useBooking(id: number) {
  return useQuery({
    queryKey: ["bookings", id],
    queryFn: () => bookingService.get(id),
    enabled: id > 0,
  });
}

export function useHoldSeats(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, seatIds }: { eventId: number; seatIds: number[] }) =>
      bookingService.hold(eventId, seatIds),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["seats", slug] });
      void qc.invalidateQueries({ queryKey: ["bookings", "me"] });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingService.cancel(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookings", "me"] });
      void qc.invalidateQueries({ queryKey: ["seats"] });
    },
  });
}

export function useApplyCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) =>
      bookingService.applyCoupon(id, code),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["bookings", data.id] });
      void qc.invalidateQueries({ queryKey: ["bookings", "me"] });
    },
  });
}

export function useRemoveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => bookingService.removeCoupon(id),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["bookings", data.id] });
      void qc.invalidateQueries({ queryKey: ["bookings", "me"] });
    },
  });
}
