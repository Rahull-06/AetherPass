import { api } from "@/services/api";
import type { Booking, SeatMap } from "@/types/booking";

export const bookingService = {
  getSeatMap(slug: string) {
    return api.get<SeatMap>(`/events/${slug}/seats`).then((r) => r.data);
  },

  hold(eventId: number, seatIds: number[]) {
    return api
      .post<Booking>("/bookings/hold", { eventId, seatIds })
      .then((r) => r.data);
  },

  cancel(id: number) {
    return api.post<Booking>(`/bookings/${id}/cancel`).then((r) => r.data);
  },

  myBookings() {
    return api.get<Booking[]>("/bookings/me").then((r) => r.data);
  },

  get(id: number) {
    return api.get<Booking>(`/bookings/${id}`).then((r) => r.data);
  },
};
