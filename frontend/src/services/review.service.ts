import { api } from "@/services/api";

export type Review = {
  id: number;
  eventId: number;
  userName: string;
  rating: number;
  comment?: string | null;
  createdAt?: string | null;
};

export const reviewService = {
  list(eventId: number) {
    return api.get<Review[]>(`/events/${eventId}/reviews`).then((r) => r.data);
  },
  upsert(eventId: number, rating: number, comment?: string) {
    return api
      .post<Review>(`/events/${eventId}/reviews`, { rating, comment })
      .then((r) => r.data);
  },
};
