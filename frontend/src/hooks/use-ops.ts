"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCouponService,
  adminUserService,
  analyticsService,
  scanService,
  type CreateCouponPayload,
  type UpdateCouponPayload,
} from "@/services/ops.service";

export function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => analyticsService.overview(),
  });
}

export function useScanTicket() {
  return useMutation({
    mutationFn: (qrPayload: string) => scanService.scan(qrPayload),
  });
}

export function useAdminUsers(params: {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () =>
      adminUserService.list({
        q: params.q || undefined,
        role: params.role || undefined,
        status: params.status || undefined,
        page: params.page ?? 0,
        size: 20,
      }),
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: number;
      status: "ACTIVE" | "SUSPENDED";
    }) => adminUserService.updateStatus(id, status),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => adminCouponService.list(),
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCouponPayload) =>
      adminCouponService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateCouponPayload;
    }) => adminCouponService.update(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
  });
}
