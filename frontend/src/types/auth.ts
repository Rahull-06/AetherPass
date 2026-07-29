export type UserRole = "ROLE_USER" | "ROLE_ORGANIZER" | "ROLE_ADMIN";

export type AuthUser = {
  id: number;
  email: string;
  fullName: string;
  phone?: string | null;
  status?: string;
  roles: UserRole[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
};

export type AuthResponse = AuthTokens & {
  userId: number;
  email: string;
  fullName: string;
  roles: UserRole[];
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
};
