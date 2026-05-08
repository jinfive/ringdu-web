import type { SignupRequest, SignupResponse } from "@/types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export async function signup(payload: SignupRequest): Promise<SignupResponse> {
  const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  let body: ApiResponse<SignupResponse> | SignupResponse | null = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(getErrorMessage(body));
  }

  if (body && "success" in body) {
    if (!body.success) {
      throw new Error(body.message || "회원가입에 실패했습니다.");
    }

    return body.data;
  }

  if (body) {
    return body as SignupResponse;
  }

  throw new Error("회원가입 응답을 확인하지 못했습니다.");
}

function getErrorMessage(body: ApiResponse<unknown> | SignupResponse | null) {
  if (body && "message" in body && typeof body.message === "string" && body.message) {
    return body.message;
  }

  return "회원가입 요청에 실패했습니다. 백엔드 서버가 실행 중인지 확인해 주세요.";
}
