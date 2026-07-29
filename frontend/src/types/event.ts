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

export type EventSummary = {
  id: number;
  title: string;
  slug: string;
  category: EventCategory;
  bannerUrl?: string | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  city: string;
  venueName: string;
  minPrice: number;
  currency: string;
};

export type TicketCategory = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  totalSeats: number;
};

export type EventDetail = {
  id: number;
  title: string;
  slug: string;
  description?: string | null;
  category: EventCategory;
  bannerUrl?: string | null;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  organizerCompany?: string | null;
  venue: {
    id: number;
    name: string;
    addressLine: string;
    city: string;
    state?: string | null;
    country: string;
    capacity?: number | null;
  };
  ticketCategories: TicketCategory[];
};

export type Venue = {
  id: number;
  name: string;
  addressLine: string;
  city: string;
  state?: string | null;
  country: string;
  capacity?: number | null;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type CreateEventPayload = {
  title: string;
  description?: string;
  category: EventCategory;
  bannerUrl?: string;
  venueId: number;
  startsAt: string;
  endsAt: string;
  ticketCategories: Array<{
    name: string;
    description?: string;
    price: number;
    totalSeats: number;
  }>;
};

export const EVENT_CATEGORIES: EventCategory[] = [
  "MUSIC",
  "COMEDY",
  "SPORTS",
  "THEATRE",
  "FESTIVAL",
  "WORKSHOP",
];
