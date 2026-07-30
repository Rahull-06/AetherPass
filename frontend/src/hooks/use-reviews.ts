"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "@/services/review.service";

export function useEventReviews(eventId: number) {
  return useQuery({
    queryKey: ["reviews", eventId],
    queryFn: () => reviewService.list(eventId),
    enabled: eventId > 0,
  });
}

export function useUpsertReview(eventId: number, slug?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment?: string }) =>
      reviewService.upsert(eventId, rating, comment),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reviews", eventId] });
      if (slug) void qc.invalidateQueries({ queryKey: ["events", slug] });
    },
  });
}
