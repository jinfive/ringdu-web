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
import type {
  AttendanceAcademyOptionResponse,
  AcademyAttendanceSessionSummaryResponse,
  AcademyStudentAttendanceRecordResponse,
  AttendanceRecordSaveRequest,
  AttendanceSessionDetailResponse,
  ParentChildAttendanceRecordResponse,
  StudentAttendanceRecordResponse,
  TeacherTodayClassResponse,
} from "@/types/attendance";
import type {
  AcademyClassDetailResponse,
  AcademyClassListQuery,
  AcademyClassRequest,
  AcademyClassResponse,
  AcademyClassStudentRequest,
  AcademyClassroomRequest,
  AcademyClassroomResponse,
} from "@/types/schedule";
import type {
  ConsultationAvailabilityRequest,
  ConsultationAvailabilityResponse,
  ConsultationAvailabilityType,
  ConsultationRequestCreateRequest,
  ConsultationRequestResponse,
  ConsultationRequestType,
  ConsultationStatus,
  ParentConsultationOptionResponse,
} from "@/types/consultation";

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

export async function searchAcademyStudents(
  keyword: string,
  accessToken: string,
): Promise<AcademyStudentResponse[]> {
  const params = new URLSearchParams();
  params.set("keyword", keyword);

  return request<AcademyStudentResponse[]>(`/api/academies/me/students/search?${params.toString()}`, {
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

export async function getAcademyClassrooms(accessToken: string): Promise<AcademyClassroomResponse[]> {
  return request<AcademyClassroomResponse[]>("/api/academies/me/classrooms", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createAcademyClassroom(
  payload: AcademyClassroomRequest,
  accessToken: string,
): Promise<AcademyClassroomResponse> {
  return request<AcademyClassroomResponse>("/api/academies/me/classrooms", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAcademyClassroom(
  classroomId: number,
  payload: AcademyClassroomRequest,
  accessToken: string,
): Promise<AcademyClassroomResponse> {
  return request<AcademyClassroomResponse>(`/api/academies/me/classrooms/${classroomId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAcademyClassroom(classroomId: number, accessToken: string): Promise<void> {
  await request<null>(`/api/academies/me/classrooms/${classroomId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAcademyClasses(
  accessToken: string,
  query: AcademyClassListQuery = {},
): Promise<AcademyClassResponse[]> {
  const params = new URLSearchParams();
  if (query.dayOfWeek) params.set("dayOfWeek", query.dayOfWeek);
  if (query.classroomId) params.set("classroomId", String(query.classroomId));
  if (query.status) params.set("status", query.status);
  const suffix = params.toString() ? `?${params.toString()}` : "";

  return request<AcademyClassResponse[]>(`/api/academies/me/classes${suffix}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createAcademyClass(
  payload: AcademyClassRequest,
  accessToken: string,
): Promise<AcademyClassResponse> {
  return request<AcademyClassResponse>("/api/academies/me/classes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAcademyClass(
  classId: number,
  accessToken: string,
): Promise<AcademyClassDetailResponse> {
  return request<AcademyClassDetailResponse>(`/api/academies/me/classes/${classId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getTeacherTodayClasses(accessToken: string): Promise<TeacherTodayClassResponse[]> {
  return request<TeacherTodayClassResponse[]>("/api/teacher/today-classes", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createTeacherAttendanceSession(
  classId: number,
  attendanceDate: string,
  accessToken: string,
): Promise<AttendanceSessionDetailResponse> {
  return request<AttendanceSessionDetailResponse>(`/api/teacher/classes/${classId}/attendance-sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ attendanceDate }),
  });
}

export async function getTeacherAttendanceSession(
  sessionId: number,
  accessToken: string,
): Promise<AttendanceSessionDetailResponse> {
  return request<AttendanceSessionDetailResponse>(`/api/teacher/attendance-sessions/${sessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function saveTeacherAttendanceRecords(
  sessionId: number,
  payload: AttendanceRecordSaveRequest,
  accessToken: string,
): Promise<AttendanceSessionDetailResponse> {
  return request<AttendanceSessionDetailResponse>(`/api/teacher/attendance-sessions/${sessionId}/records`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAcademyClassAttendanceSessions(
  classId: number,
  accessToken: string,
): Promise<AcademyAttendanceSessionSummaryResponse[]> {
  return request<AcademyAttendanceSessionSummaryResponse[]>(`/api/academies/me/classes/${classId}/attendance-sessions`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAcademyAttendanceSession(
  sessionId: number,
  accessToken: string,
): Promise<AttendanceSessionDetailResponse> {
  return request<AttendanceSessionDetailResponse>(`/api/academies/me/attendance-sessions/${sessionId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getAcademyStudentAttendanceRecords(
  studentProfileId: number,
  accessToken: string,
): Promise<AcademyStudentAttendanceRecordResponse[]> {
  return request<AcademyStudentAttendanceRecordResponse[]>(
    `/api/academies/me/students/${studentProfileId}/attendance-records`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function getStudentAcademies(accessToken: string): Promise<AttendanceAcademyOptionResponse[]> {
  return request<AttendanceAcademyOptionResponse[]>("/api/student/academies", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getStudentAttendanceRecords(
  query: { academyId?: number | null; year: number; month: number },
  accessToken: string,
): Promise<StudentAttendanceRecordResponse[]> {
  const params = new URLSearchParams({
    year: String(query.year),
    month: String(query.month),
  });
  if (query.academyId) {
    params.set("academyId", String(query.academyId));
  }
  return request<StudentAttendanceRecordResponse[]>(`/api/student/attendance-records?${params.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getParentChildAcademies(
  studentProfileId: number,
  accessToken: string,
): Promise<AttendanceAcademyOptionResponse[]> {
  return request<AttendanceAcademyOptionResponse[]>(`/api/parent/children/${studentProfileId}/academies`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getParentChildAttendanceRecords(
  studentProfileId: number,
  query: { academyId?: number | null; year: number; month: number },
  accessToken: string,
): Promise<ParentChildAttendanceRecordResponse[]> {
  const params = new URLSearchParams({
    year: String(query.year),
    month: String(query.month),
  });
  if (query.academyId) {
    params.set("academyId", String(query.academyId));
  }
  return request<ParentChildAttendanceRecordResponse[]>(
    `/api/parent/children/${studentProfileId}/attendance-records?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function getAcademyStudentClasses(
  studentProfileId: number,
  accessToken: string,
): Promise<AcademyClassResponse[]> {
  return request<AcademyClassResponse[]>(`/api/academies/me/students/${studentProfileId}/classes`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateAcademyClass(
  classId: number,
  payload: AcademyClassRequest,
  accessToken: string,
): Promise<AcademyClassResponse> {
  return request<AcademyClassResponse>(`/api/academies/me/classes/${classId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function deleteAcademyClass(classId: number, accessToken: string): Promise<void> {
  await request<null>(`/api/academies/me/classes/${classId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function addAcademyClassStudent(
  classId: number,
  payload: AcademyClassStudentRequest | number,
  accessToken: string,
): Promise<AcademyClassDetailResponse> {
  const body = typeof payload === "number" ? { studentProfileId: payload } : payload;

  return request<AcademyClassDetailResponse>(`/api/academies/me/classes/${classId}/students`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });
}

export async function deleteAcademyClassStudent(
  classId: number,
  studentProfileId: number,
  accessToken: string,
): Promise<void> {
  await request<null>(`/api/academies/me/classes/${classId}/students/${studentProfileId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function removeAcademyClassStudent(
  classId: number,
  studentProfileId: number,
  accessToken: string,
): Promise<void> {
  await deleteAcademyClassStudent(classId, studentProfileId, accessToken);
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

export async function getAcademyConsultationAvailability(
  accessToken: string,
): Promise<ConsultationAvailabilityResponse[]> {
  return request<ConsultationAvailabilityResponse[]>("/api/academies/me/consultation-availability", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createAcademyConsultationAvailability(
  payload: ConsultationAvailabilityRequest,
  accessToken: string,
): Promise<ConsultationAvailabilityResponse> {
  return request<ConsultationAvailabilityResponse>("/api/academies/me/consultation-availability", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function updateAcademyConsultationAvailability(
  availabilityId: number,
  payload: ConsultationAvailabilityRequest,
  accessToken: string,
): Promise<ConsultationAvailabilityResponse> {
  return request<ConsultationAvailabilityResponse>(
    `/api/academies/me/consultation-availability/${availabilityId}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    },
  );
}

export async function deleteAcademyConsultationAvailability(
  availabilityId: number,
  accessToken: string,
): Promise<ConsultationAvailabilityResponse> {
  return request<ConsultationAvailabilityResponse>(
    `/api/academies/me/consultation-availability/${availabilityId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function getAcademyPublicConsultationAvailability(
  academyId: number,
  type: ConsultationAvailabilityType,
  accessToken: string,
): Promise<ConsultationAvailabilityResponse[]> {
  const params = new URLSearchParams({ type });
  return request<ConsultationAvailabilityResponse[]>(
    `/api/academies/${academyId}/consultation-availability?${params.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );
}

export async function getParentConsultationOptions(
  accessToken: string,
): Promise<ParentConsultationOptionResponse[]> {
  return request<ParentConsultationOptionResponse[]>("/api/parent/consultation-options", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getParentConsultationRequests(
  accessToken: string,
): Promise<ConsultationRequestResponse[]> {
  return request<ConsultationRequestResponse[]>("/api/parent/consultation-requests", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createParentConsultationRequest(
  payload: ConsultationRequestCreateRequest,
  accessToken: string,
): Promise<ConsultationRequestResponse> {
  return request<ConsultationRequestResponse>("/api/parent/consultation-requests", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getAcademyConsultationRequests(
  accessToken: string,
  query: {
    status?: ConsultationStatus | null;
    from?: string | null;
    to?: string | null;
    type?: ConsultationRequestType | null;
    studentProfileId?: number | null;
  } = {},
): Promise<ConsultationRequestResponse[]> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.type) params.set("type", query.type);
  if (query.studentProfileId) params.set("studentProfileId", String(query.studentProfileId));
  const suffix = params.toString() ? `?${params.toString()}` : "";

  return request<ConsultationRequestResponse[]>(`/api/academies/me/consultation-requests${suffix}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

async function processAcademyConsultationRequest(
  requestId: number,
  action: "approve" | "reject" | "complete",
  accessToken: string,
  memo?: string,
): Promise<ConsultationRequestResponse> {
  return request<ConsultationRequestResponse>(
    `/api/academies/me/consultation-requests/${requestId}/${action}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ memo: memo ?? "" }),
    },
  );
}

export async function approveAcademyConsultationRequest(
  requestId: number,
  accessToken: string,
  memo?: string,
): Promise<ConsultationRequestResponse> {
  return processAcademyConsultationRequest(requestId, "approve", accessToken, memo);
}

export async function rejectAcademyConsultationRequest(
  requestId: number,
  accessToken: string,
  memo?: string,
): Promise<ConsultationRequestResponse> {
  return processAcademyConsultationRequest(requestId, "reject", accessToken, memo);
}

export async function completeAcademyConsultationRequest(
  requestId: number,
  accessToken: string,
  memo?: string,
): Promise<ConsultationRequestResponse> {
  return processAcademyConsultationRequest(requestId, "complete", accessToken, memo);
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
