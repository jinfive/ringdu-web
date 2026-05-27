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
  status: UserStatus;
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
  teacherUserId?: number | null;
  teacherPhone: string;
  message: string;
};

export type TeacherInvitationResponse = TeacherInvitationCreateRequest & {
  invitationId: number;
  teacherUserId: number | null;
  teacherEmail: string | null;
  status: TeacherInvitationStatus;
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
};

export type MyTeacherInvitationResponse = {
  invitationId: number;
  academyId: number;
  academyName: string;
  teacherUserId: number | null;
  teacherEmail: string | null;
  teacherPhone: string;
  message: string | null;
  status: TeacherInvitationStatus;
  createdAt: string;
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

export type ParentStudentInvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELED";
export type ParentStudentInvitationDirection = "SENT" | "RECEIVED";

export type ParentStudentInvitationResponse = {
  invitationId: number;
  requesterUserId: number;
  requesterName: string;
  receiverEmail: string | null;
  receiverPhone: string;
  requesterRole: "PARENT" | "STUDENT";
  targetRole: "PARENT" | "STUDENT";
  studentUserId: number | null;
  parentUserId: number | null;
  message: string | null;
  status: ParentStudentInvitationStatus;
  direction: ParentStudentInvitationDirection;
  createdAt: string;
  respondedAt: string | null;
  expiresAt: string | null;
};

export type ParentStudentRelationResponse = {
  relationId: number;
  parentUserId: number;
  parentName: string;
  parentEmail: string;
  studentUserId: number;
  studentName: string;
  studentEmail: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

export type ParentStudentInvitationCreateRequest = {
  studentEmail?: string | null;
  studentPhone: string;
  message: string;
};

export type StudentParentInvitationCreateRequest = {
  parentEmail?: string | null;
  parentPhone: string;
  message: string;
};

export type StudentStatus = "ACTIVE" | "INACTIVE" | "GRADUATED";

export type AcademyStudentCreateRequest = {
  name: string;
  birthDate?: string | null;
  school: string | null;
  grade: string | null;
  email?: string | null;
  phone: string | null;
  guardianPhone: string | null;
  guardianParentUserId?: number | null;
  memo: string | null;
};

export type AcademyStudentResponse = AcademyStudentCreateRequest & {
  id: number;
  academyId: number;
  userId: number | null;
  status: StudentStatus;
  matchedStudentUserExists: boolean;
  guardianAccountLinked: boolean;
  guardianParentName: string | null;
  guardianParentEmail: string | null;
  guardianParentPhone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AccountCandidateResponse = {
  candidates: CandidateDto[];
};

export type CandidateDto = {
  userId: number;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
};

export type AcademyStudentInvitationStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "CANCELED";

export type AcademyStudentInvitationCreateRequest = {
  studentProfileId: number | null;
  receiverUserId: number;
  receiverEmail: string | null;
  receiverPhone: string | null;
  message: string | null;
};

export type AcademyStudentInvitationResponse = {
  id: number;
  academyId: number;
  academyName: string;
  studentProfileId: number | null;
  receiverUserId: number;
  receiverEmail: string | null;
  receiverPhone: string | null;
  message: string | null;
  status: AcademyStudentInvitationStatus;
  createdByUserId: number;
  respondedByUserId: number | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
