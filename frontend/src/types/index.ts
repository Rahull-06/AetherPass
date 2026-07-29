export type UserRole = "ROLE_USER" | "ROLE_ORGANIZER" | "ROLE_ADMIN";

export type {
  EventCategory,
  EventStatus,
  EventSummary,
  EventDetail,
  Venue,
} from "@/types/event";

export type SeatStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";
