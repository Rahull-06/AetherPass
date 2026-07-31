import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/services/token-storage";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  // Render free tier cold starts often exceed 15s.
  timeout: 60_000,
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) {
    tokenStorage.clear();
    return null;
  }

  try {
    // Use a bare axios call to avoid interceptor recursion.
    const { data } = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken },
      { timeout: 60_000 },
    );
    const accessToken = data.accessToken as string;
    const nextRefresh = data.refreshToken as string;
    const user = tokenStorage.getUser();
    if (user) {
      tokenStorage.setSession(accessToken, nextRefresh, {
        ...user,
        id: data.userId ?? user.id,
        email: data.email ?? user.email,
        fullName: data.fullName ?? user.fullName,
        roles: data.roles ?? user.roles,
      });
    } else {
      tokenStorage.setTokens(accessToken, nextRefresh);
    }
    return accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";

    const isAuthPublic =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout") ||
      url.includes("/auth/forgot-password") ||
      url.includes("/auth/reset-password");

    if (status !== 401 || !original || original._retry || isAuthPublic) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (!newToken) {
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);
