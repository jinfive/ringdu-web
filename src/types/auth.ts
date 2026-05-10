export type SignupRole = "TEACHER" | "PARENT" | "STUDENT";
export type UserRole = "ACADEMY" | SignupRole | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE";
export type AuthProvider = "LOCAL" | "KAKAO" | "NAVER" | "GOOGLE";

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: SignupRole;
};

export type SignupResponse = {
  userId: number;
  email: string;
  name: string;
  role: SignupRole;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthUser = {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
};

export type LoginResponse = AuthUser & {
  accessToken: string;
  tokenType: "Bearer";
};

export type TokenRefreshResponse = {
  accessToken: string;
  tokenType: "Bearer";
};

export type MeResponse = AuthUser & {
  phone: string | null;
  status: UserStatus;
  provider: AuthProvider;
};

export type CreateAcademyAccountRequest = {
  email: string;
  password: string;
  name: string;
  phone: string;
};

export type AcademyAccountResponse = {
  userId: number;
  email: string;
  name: string;
  phone: string;
  role: "ACADEMY";
  status: UserStatus;
  createdAt: string;
};
