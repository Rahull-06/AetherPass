"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", "me"],
    queryFn: () => notificationService.mine(),
    refetchInterval: 30_000,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => notificationService.unreadCount(),
    enabled,
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
