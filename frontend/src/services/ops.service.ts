import { api } from "@/services/api";

export type PopularEvent = {
  eventId: number;
  title: string;
  slug: string;
  ticketsSold: number;
  revenue: number;
};

export type AnalyticsOverview = {
  totalUsers: number;
  totalEvents: number;
  publishedEvents: number;
  ticketsSold: number;
  confirmedBookings: number;
  totalRevenue: number;
  popularEvents: PopularEvent[];
};

export type ScanResult = {
  valid: boolean;
  message: string;
  ticketCode?: string | null;
  ticketStatus?: string | null;
  seatLabel?: string | null;
  bookingCode?: string | null;
  eventTitle?: string | null;
  holderName?: string | null;
  usedAt?: string | null;
};

export type AdminUser = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  status: string;
  emailVerified: boolean;
  roles: string[];
  createdAt: string;
};

export type AdminUserPage = {
  content: AdminUser[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

export type Coupon = {
  id: number;
  code: string;
  description?: string | null;
  discountType: "PERCENT" | "FLAT" | string;
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number | null;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  createdAt?: string;
};

export type CreateCouponPayload = {
  code: string;
  description?: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  minOrderAmount?: number;
  maxUses?: number | null;
  validFrom: string;
  validUntil: string;
  active?: boolean;
};

export type UpdateCouponPayload = {
  description?: string;
  discountType?: "PERCENT" | "FLAT";
  discountValue?: number;
  minOrderAmount?: number;
  maxUses?: number | null;
  validFrom?: string;
  validUntil?: string;
  active?: boolean;
};

export const analyticsService = {
  overview() {
    return api.get<AnalyticsOverview>("/admin/analytics").then((r) => r.data);
  },
};

export const scanService = {
  scan(qrPayload: string) {
    return api
      .post<ScanResult>("/organizer/scan", { qrPayload })
      .then((r) => r.data);
  },
};

export const adminUserService = {
  list(params?: {
    q?: string;
    role?: string;
    status?: string;
    page?: number;
    size?: number;
  }) {
    return api
      .get<AdminUserPage>("/admin/users", { params })
      .then((r) => r.data);
  },

  updateStatus(id: number, status: "ACTIVE" | "SUSPENDED") {
    return api
      .patch<AdminUser>(`/admin/users/${id}/status`, { status })
      .then((r) => r.data);
  },
};

export const adminCouponService = {
  list() {
    return api.get<Coupon[]>("/admin/coupons").then((r) => r.data);
  },

  create(payload: CreateCouponPayload) {
    return api.post<Coupon>("/admin/coupons", payload).then((r) => r.data);
  },

  update(id: number, payload: UpdateCouponPayload) {
    return api
      .patch<Coupon>(`/admin/coupons/${id}`, payload)
      .then((r) => r.data);
  },
};
