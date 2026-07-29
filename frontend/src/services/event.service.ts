import { api } from "@/services/api";
import type {
  CreateEventPayload,
  EventDetail,
  EventSummary,
  PageResponse,
  Venue,
} from "@/types/event";

export type BrowseParams = {
  q?: string;
  category?: string;
  city?: string;
  page?: number;
  size?: number;
};

export const eventService = {
  browse(params: BrowseParams = {}) {
    return api
      .get<PageResponse<EventSummary>>("/events", { params })
      .then((r) => r.data);
  },

  getBySlug(slug: string) {
    return api.get<EventDetail>(`/events/${slug}`).then((r) => r.data);
  },

  listVenues() {
    return api.get<Venue[]>("/venues").then((r) => r.data);
  },

  listMine() {
    return api
      .get<EventSummary[]>("/organizer/events")
      .then((r) => r.data);
  },

  create(payload: CreateEventPayload) {
    return api
      .post<EventDetail>("/organizer/events", payload)
      .then((r) => r.data);
  },

  submit(id: number) {
    return api
      .post<EventDetail>(`/organizer/events/${id}/submit`)
      .then((r) => r.data);
  },

  cancel(id: number) {
    return api
      .post<EventDetail>(`/organizer/events/${id}/cancel`)
      .then((r) => r.data);
  },

  listPending() {
    return api
      .get<EventSummary[]>("/admin/events/pending")
      .then((r) => r.data);
  },

  approve(id: number) {
    return api
      .post<EventDetail>(`/admin/events/${id}/approve`)
      .then((r) => r.data);
  },

  reject(id: number) {
    return api
      .post<EventDetail>(`/admin/events/${id}/reject`)
      .then((r) => r.data);
  },
};
