import { api } from "@/services/api";
import type { EventSummary } from "@/types/event";

export const wishlistService = {
  mine() {
    return api.get<EventSummary[]>("/wishlist").then((r) => r.data);
  },
  add(eventId: number) {
    return api.post(`/wishlist/${eventId}`);
  },
  remove(eventId: number) {
    return api.delete(`/wishlist/${eventId}`);
  },
};
