import type {
  AcademyAccountResponse,
  AcademyDashboardResponse,
  AcademyResponse,
  AcademySignupApplication,
  AcademySignupApprovalResponse,
  AcademySignupRequest,
  AcademySignupResponse,
  AcademyStudentCreateRequest,
  AcademyStudentResponse,
  AcademyTeacherResponse,
  AcademyUpdateRequest,
  CreateAcademyAccountRequest,
  LoginRequest,
  LoginResponse,
  MeResponse,
  MyTeacherInvitationResponse,
  ParentStudentInvitationCreateRequest,
  ParentStudentInvitationResponse,
  ParentStudentRelationResponse,
  SignupRequest,
  SignupResponse,
  StudentParentInvitationCreateRequest,
  TeacherInvitationCreateRequest,
  TeacherInvitationResponse,
  TokenRefreshResponse,
  AccountCandidateResponse,
  AcademyStudentInvitationCreateRequest,
  AcademyStudentInvitationResponse,
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

export async function requestAcademySignup(
  payload: AcademySignupRequest,
): Promise<AcademySignupResponse> {
  return request<AcademySignupResponse>("/api/auth/signup/academy", {
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

export async function getAcademySignupApplications(
  accessToken: string,
): Promise<AcademySignupApplication[]> {
  return request<AcademySignupApplication[]>("/api/admin/academy-signup-applications", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function approveAcademySignupApplication(
  applicationId: number,
  accessToken: string,
): Promise<AcademySignupApprovalResponse> {
  return request<AcademySignupApprovalResponse>(
    `/api/admin/academy-signup-applications/${applicationId}/approve`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function getMyAcademy(accessToken: string): Promise<AcademyResponse> {
  return request<AcademyResponse>("/api/academies/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateMyAcademy(
  payload: AcademyUpdateRequest,
  accessToken: string,
): Promise<AcademyResponse> {
  return request<AcademyResponse>("/api/academies/me", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAcademyDashboard(
  accessToken: string,
): Promise<AcademyDashboardResponse> {
  return request<AcademyDashboardResponse>("/api/academies/me/dashboard", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createTeacherInvitation(
  payload: TeacherInvitationCreateRequest,
  accessToken: string,
): Promise<TeacherInvitationResponse> {
  return request<TeacherInvitationResponse>("/api/academies/me/teacher-invitations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAcademyTeacherInvitations(
  accessToken: string,
): Promise<TeacherInvitationResponse[]> {
  return request<TeacherInvitationResponse[]>("/api/academies/me/teacher-invitations", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAcademyTeachers(accessToken: string): Promise<AcademyTeacherResponse[]> {
  return request<AcademyTeacherResponse[]>("/api/academies/me/teachers", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getMyTeacherInvitations(
  accessToken: string,
): Promise<MyTeacherInvitationResponse[]> {
  return request<MyTeacherInvitationResponse[]>("/api/teacher/invitations", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function acceptTeacherInvitation(
  invitationId: number,
  accessToken: string,
): Promise<MyTeacherInvitationResponse> {
  return request<MyTeacherInvitationResponse>(`/api/teacher/invitations/${invitationId}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function rejectTeacherInvitation(
  invitationId: number,
  accessToken: string,
): Promise<MyTeacherInvitationResponse> {
  return request<MyTeacherInvitationResponse>(`/api/teacher/invitations/${invitationId}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createParentStudentInvitation(
  payload: ParentStudentInvitationCreateRequest,
  accessToken: string,
): Promise<ParentStudentInvitationResponse> {
  return request<ParentStudentInvitationResponse>("/api/parent/student-invitations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function createStudentParentInvitation(
  payload: StudentParentInvitationCreateRequest,
  accessToken: string,
): Promise<ParentStudentInvitationResponse> {
  return request<ParentStudentInvitationResponse>("/api/student/parent-invitations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getParentInvitations(accessToken: string): Promise<ParentStudentInvitationResponse[]> {
  return request<ParentStudentInvitationResponse[]>("/api/parent/invitations", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getStudentInvitations(accessToken: string): Promise<ParentStudentInvitationResponse[]> {
  return request<ParentStudentInvitationResponse[]>("/api/student/invitations", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getParentStudents(accessToken: string): Promise<ParentStudentRelationResponse[]> {
  return request<ParentStudentRelationResponse[]>("/api/parent/students", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getStudentParents(accessToken: string): Promise<ParentStudentRelationResponse[]> {
  return request<ParentStudentRelationResponse[]>("/api/student/parents", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function acceptParentStudentInvitation(
  invitationId: number,
  accessToken: string,
): Promise<ParentStudentInvitationResponse> {
  return request<ParentStudentInvitationResponse>(`/api/parent-student-invitations/${invitationId}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function rejectParentStudentInvitation(
  invitationId: number,
  accessToken: string,
): Promise<ParentStudentInvitationResponse> {
  return request<ParentStudentInvitationResponse>(`/api/parent-student-invitations/${invitationId}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createAcademyStudent(
  payload: AcademyStudentCreateRequest,
  accessToken: string,
): Promise<AcademyStudentResponse> {
  return request<AcademyStudentResponse>("/api/academies/me/students", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAcademyStudents(accessToken: string): Promise<AcademyStudentResponse[]> {
  return request<AcademyStudentResponse[]>("/api/academies/me/students", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAcademyStudent(
  studentId: number,
  accessToken: string,
): Promise<AcademyStudentResponse> {
  return request<AcademyStudentResponse>(`/api/academies/me/students/${studentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateAcademyStudent(
  studentId: number,
  payload: AcademyStudentCreateRequest,
  accessToken: string,
): Promise<AcademyStudentResponse> {
  return request<AcademyStudentResponse>(`/api/academies/me/students/${studentId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}


export async function searchAccountCandidates(
  role: "STUDENT" | "PARENT" | "TEACHER",
  phone?: string,
  accessToken?: string
): Promise<AccountCandidateResponse> {
  const params = new URLSearchParams({ role });
  if (phone) params.append("phone", phone);

  return request<AccountCandidateResponse>(`/api/academies/me/account-candidates?${params.toString()}`, {
    method: "GET",
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
}

export async function createAcademyStudentInvitation(
  payload: AcademyStudentInvitationCreateRequest,
  accessToken: string
): Promise<AcademyStudentInvitationResponse> {
  return request<AcademyStudentInvitationResponse>("/api/academies/me/student-invitations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAcademyStudentInvitations(
  accessToken: string
): Promise<AcademyStudentInvitationResponse[]> {
  return request<AcademyStudentInvitationResponse[]>("/api/academies/me/student-invitations", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getStudentAcademyInvitations(
  accessToken: string
): Promise<AcademyStudentInvitationResponse[]> {
  return request<AcademyStudentInvitationResponse[]>("/api/student/academy-invitations", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function acceptStudentAcademyInvitation(
  invitationId: number,
  accessToken: string
): Promise<void> {
  await request<null>(`/api/student/academy-invitations/${invitationId}/accept`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function rejectStudentAcademyInvitation(
  invitationId: number,
  accessToken: string
): Promise<void> {
  await request<null>(`/api/student/academy-invitations/${invitationId}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
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
