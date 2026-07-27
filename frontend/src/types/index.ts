export type UserRole = "ROLE_USER" | "ROLE_ORGANIZER" | "ROLE_ADMIN";

export type EventCategory =
  | "MUSIC"
  | "COMEDY"
  | "SPORTS"
  | "THEATRE"
  | "FESTIVAL"
  | "WORKSHOP";

export type EventStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "PUBLISHED"
  | "CANCELLED"
  | "COMPLETED";

export type SeatStatus = "AVAILABLE" | "BOOKED" | "BLOCKED";

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "EXPIRED"
  | "REFUNDED";
