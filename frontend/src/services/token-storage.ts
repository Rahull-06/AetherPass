import type { AuthUser } from "@/types/auth";

const ACCESS_KEY = "aetherpass_access_token";
const REFRESH_KEY = "aetherpass_refresh_token";
const USER_KEY = "aetherpass_user";

function canUseStorage() {
  return typeof window !== "undefined";
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(REFRESH_KEY);
  },

  getUser(): AuthUser | null {
    if (!canUseStorage()) return null;
    const raw = window.localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      return null;
    }
  },

  setSession(accessToken: string, refreshToken: string, user: AuthUser) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ACCESS_KEY, accessToken);
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  setTokens(accessToken: string, refreshToken: string) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ACCESS_KEY, accessToken);
    window.localStorage.setItem(REFRESH_KEY, refreshToken);
  },

  clear() {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(ACCESS_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
    window.localStorage.removeItem(USER_KEY);
  },
};
