export type SignupRole = "TEACHER" | "PARENT" | "STUDENT";
export type UserRole = "ACADEMY" | SignupRole | "ADMIN";
export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING_APPROVAL";
export type AuthProvider = "LOCAL" | "KAKAO" | "NAVER" | "GOOGLE";
export type AcademyStatus = "ACTIVE" | "INACTIVE";

export type SignupRequest = {
  email: string;
  password: string;
  passwordConfirm: string;
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

export type AcademySignupRequest = {
  email: string;
  password: string;
  passwordConfirm: string;
  academyName: string;
  representativeName: string;
  phone: string;
  postalCode: string;
  address: string;
  detailAddress: string;
};

export type AcademySignupResponse = {
  applicationId: number;
  userId: number;
  email: string;
  name: string;
  phone: string;
  role: "ACADEMY";
  status: "PENDING_APPROVAL";
  academyName: string;
  representativeName: string;
  postalCode: string;
  address: string;
  detailAddress: string;
  applicationStatus: "PENDING";
  createdAt: string;
};

export type AcademySignupApplication = {
  applicationId: number;
  userId: number;
  email: string;
  academyName: string;
  representativeName: string;
  phone: string;
  postalCode: string;
  address: string;
  detailAddress: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export type AcademySignupApprovalResponse = {
  applicationId: number;
  userId: number;
  email: string;
  academyName: string;
  role: "ACADEMY";
  userStatus: "ACTIVE";
  applicationStatus: "APPROVED";
  approvedAt: string;
};

export type AcademyResponse = {
  academyId: number;
  name: string;
  representativeName: string;
  phone: string;
  postalCode: string | null;
  address: string | null;
  detailAddress: string | null;
  status: AcademyStatus;
  createdAt: string;
};

export type AcademyUpdateRequest = {
  name: string;
  representativeName: string;
  phone: string;
  postalCode: string;
  address: string;
  detailAddress: string;
};

export type AcademyDashboardNotification = {
  type: "INFO" | "WARN" | "ERROR" | string;
  title: string;
  message: string;
  targetPath: string;
};

export type AcademyDashboardResponse = {
  studentCount: number;
  teacherCount: number;
  unpaidInvoiceCount: number;
  pendingConsultationCount: number;
  notifications: AcademyDashboardNotification[];
};

export type TeacherInvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELED";

export type TeacherInvitationCreateRequest = {
  teacherEmail: string;
  teacherPhone: string;
  message: string;
};

export type TeacherInvitationResponse = TeacherInvitationCreateRequest & {
  invitationId: number;
  status: TeacherInvitationStatus;
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
};

export type AcademyTeacherResponse = {
  teacherUserId: number;
  name: string;
  email: string;
  phone: string | null;
  memberStatus: "ACTIVE" | "INACTIVE";
  connectedAt: string;
};
