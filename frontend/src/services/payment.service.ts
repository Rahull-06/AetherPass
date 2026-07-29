import { api } from "@/services/api";
import type { Booking } from "@/types/booking";
import type { PaymentOrder, VerifyPaymentPayload } from "@/types/payment";

export const paymentService = {
  createOrder(bookingId: number) {
    return api
      .post<PaymentOrder>("/payments/create-order", { bookingId })
      .then((r) => r.data);
  },

  verify(payload: VerifyPaymentPayload) {
    return api.post<Booking>("/payments/verify", payload).then((r) => r.data);
  },

  mockComplete(bookingId: number) {
    return api
      .post<Booking>(`/payments/mock-complete/${bookingId}`)
      .then((r) => r.data);
  },
};
