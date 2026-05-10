import type {
  AcademyAccountResponse,
  CreateAcademyAccountRequest,
  LoginRequest,
  LoginResponse,
  MeResponse,
  SignupRequest,
  SignupResponse,
  TokenRefreshResponse,
} from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  return request<SignupResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export async function refreshAccessToken(): Promise<TokenRefreshResponse> {
  return request<TokenRefreshResponse>("/api/auth/refresh", {
    method: "POST",
    credentials: "include",
  });
}

export async function getMe(accessToken: string): Promise<MeResponse> {
  return request<MeResponse>("/api/auth/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function logout(): Promise<void> {
  await request<null>("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}

export async function createAcademyAccount(
  payload: CreateAcademyAccountRequest,
  accessToken: string,
): Promise<AcademyAccountResponse> {
  return request<AcademyAccountResponse>("/api/admin/academy-accounts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  let body: ApiResponse<T> | T | null = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new ApiError(getErrorMessage(body), response.status);
  }

  if (isApiResponse<T>(body)) {
    if (!body.success) {
      throw new ApiError(body.message || "요청을 처리하지 못했습니다.", response.status);
    }

    return body.data;
  }

  if (body) {
    return body as T;
  }

  return null as T;
}

function getErrorMessage(body: ApiResponse<unknown> | unknown | null) {
  if (
    body &&
    typeof body === "object" &&
    "message" in body &&
    typeof body.message === "string" &&
    body.message
  ) {
    return body.message;
  }

  return "요청을 처리하지 못했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.";
}

function isApiResponse<T>(body: ApiResponse<T> | T | null): body is ApiResponse<T> {
  return Boolean(body && typeof body === "object" && "success" in body);
}
