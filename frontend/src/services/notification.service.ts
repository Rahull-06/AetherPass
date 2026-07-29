import { api } from "@/services/api";
import type { AppNotification } from "@/types/notification";

export const notificationService = {
  mine() {
    return api.get<AppNotification[]>("/notifications/me").then((r) => r.data);
  },

  unreadCount() {
    return api
      .get<{ count: number }>("/notifications/me/unread-count")
      .then((r) => r.data.count);
  },

  markRead(id: number) {
    return api.post(`/notifications/${id}/read`);
  },

  markAllRead() {
    return api.post("/notifications/me/read-all");
  },
};
