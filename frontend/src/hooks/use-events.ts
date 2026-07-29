"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService, type BrowseParams } from "@/services/event.service";
import type { CreateEventPayload } from "@/types/event";

export function useBrowseEvents(params: BrowseParams) {
  return useQuery({
    queryKey: ["events", "browse", params],
    queryFn: () => eventService.browse(params),
  });
}

export function useEventDetail(slug: string) {
  return useQuery({
    queryKey: ["events", "detail", slug],
    queryFn: () => eventService.getBySlug(slug),
    enabled: Boolean(slug),
  });
}

export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: () => eventService.listVenues(),
  });
}

export function useMyEvents() {
  return useQuery({
    queryKey: ["organizer", "events"],
    queryFn: () => eventService.listMine(),
  });
}

export function usePendingEvents() {
  return useQuery({
    queryKey: ["admin", "events", "pending"],
    queryFn: () => eventService.listPending(),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => eventService.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["organizer", "events"] });
    },
  });
}

export function useSubmitEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventService.submit(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["organizer", "events"] });
      void qc.invalidateQueries({ queryKey: ["admin", "events", "pending"] });
    },
  });
}

export function useApproveEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventService.approve(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "events", "pending"] });
      void qc.invalidateQueries({ queryKey: ["events", "browse"] });
    },
  });
}

export function useRejectEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => eventService.reject(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "events", "pending"] });
      void qc.invalidateQueries({ queryKey: ["organizer", "events"] });
    },
  });
}
