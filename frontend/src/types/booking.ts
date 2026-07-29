export type SeatState = "AVAILABLE" | "LOCKED" | "BOOKED" | "BLOCKED" | "MINE";

export type SeatCell = {
  id: number;
  rowLabel: string;
  seatNumber: string;
  label: string;
  categoryId: number;
  categoryName: string;
  price: number;
  currency: string;
  state: SeatState;
};

export type SeatMap = {
  eventId: number;
  eventTitle: string;
  eventSlug: string;
  lockTtlSeconds: number;
  seats: SeatCell[];
};

export type Booking = {
  id: number;
  bookingCode: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EXPIRED" | "REFUNDED";
  eventId: number;
  eventTitle: string;
  eventSlug: string;
  startsAt: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  expiresAt?: string | null;
  createdAt?: string | null;
  seats: Array<{
    id: number;
    label: string;
    categoryName?: string | null;
    price?: number | null;
  }>;
  tickets: Array<{
    id: number;
    ticketCode: string;
    qrPayload: string;
    status: string;
    seatLabel?: string | null;
  }>;
};
