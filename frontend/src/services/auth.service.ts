import { api } from "@/services/api";
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  UserRole,
} from "@/types/auth";
import { tokenStorage } from "@/services/token-storage";

type MeResponse = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  status?: string;
  roles: UserRole[];
};

function toUser(res: AuthResponse): AuthUser {
  return {
    id: res.userId,
    email: res.email,
    fullName: res.fullName,
    roles: (res.roles ?? []) as UserRole[],
  };
}

function persist(res: AuthResponse) {
  const user = toUser(res);
  tokenStorage.setSession(res.accessToken, res.refreshToken, user);
  return { ...res, user };
}

export const authService = {
  async register(payload: RegisterPayload) {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return persist(data);
  },

  async login(payload: LoginPayload) {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return persist(data);
  },

  async refresh(refreshToken: string) {
    const { data } = await api.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });
    return persist(data);
  },

  async logout() {
    const refreshToken = tokenStorage.getRefreshToken();
    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } finally {
      tokenStorage.clear();
    }
  },

  async forgotPassword(email: string) {
    const { data } = await api.post<{ message: string; resetLink?: string }>(
      "/auth/forgot-password",
      { email },
    );
    return data;
  },

  async resetPassword(token: string, newPassword: string) {
    await api.post("/auth/reset-password", { token, newPassword });
  },

  async me() {
    const { data } = await api.get<MeResponse>("/auth/me");
    const user: AuthUser = {
      id: data.id,
      email: data.email,
      fullName: data.fullName,
      phone: data.phone,
      status: data.status,
      roles: (data.roles ?? []) as UserRole[],
    };
    const access = tokenStorage.getAccessToken();
    const refresh = tokenStorage.getRefreshToken();
    if (access && refresh) {
      tokenStorage.setSession(access, refresh, user);
    }
    return user;
  },
};

export function homeForRoles(roles: UserRole[]): string {
  if (roles.includes("ROLE_ADMIN")) return "/admin/dashboard";
  if (roles.includes("ROLE_ORGANIZER")) return "/organizer/dashboard";
  return "/events";
}
