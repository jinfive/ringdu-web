export type ConsultationStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED" | "CANCELED";

export type ConsultationTopic = "STUDY" | "LIFE" | "PROGRESS" | "ETC";

export type ConsultationRequestType = "NEW_STUDENT" | "ENROLLED_STUDENT";

export type ConsultationAvailabilityDay =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type ConsultationAvailabilityType = "NEW_STUDENT" | "ENROLLED_STUDENT" | "ALL";

export type ConsultationAvailabilityStatus = "ACTIVE" | "INACTIVE";

export type ConsultationAvailabilityRequest = {
  dayOfWeek: ConsultationAvailabilityDay;
  startTime: string;
  endTime: string;
  consultationType: ConsultationAvailabilityType;
};

export type ConsultationAvailabilityResponse = ConsultationAvailabilityRequest & {
  availabilityId: number;
  dayLabel: string;
  status: ConsultationAvailabilityStatus;
};

export type ParentConsultationOptionResponse = {
  studentProfileId: number;
  studentName: string;
  academyId: number;
  academyName: string;
  teachers: ParentConsultationTeacherOption[];
};

export type ParentConsultationTeacherOption = {
  teacherUserId: number;
  teacherName: string;
  classId: number;
  className: string;
};

export type ConsultationRequestCreateRequest = {
  academyId: number;
  studentProfileId: number;
  teacherUserId?: number | null;
  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  topic: ConsultationTopic;
  content: string;
};

export type ConsultationRequestResponse = {
  consultationRequestId: number;
  academyId: number;
  academyName: string;
  studentProfileId: number;
  studentName: string;
  parentPhone?: string | null;
  teacherUserId?: number | null;
  teacherName?: string | null;
  requestedDate: string;
  requestedStartTime: string;
  requestedEndTime: string;
  consultationType: "ENROLLED_STUDENT";
  topic: ConsultationTopic;
  topicLabel: string;
  content: string;
  status: ConsultationStatus;
  statusLabel: string;
  academyMemo?: string | null;
};

export const consultationStatusLabels: Record<ConsultationStatus, string> = {
  REQUESTED: "요청됨",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
  COMPLETED: "완료됨",
  CANCELED: "취소됨",
};

export const consultationStatusStyles: Record<ConsultationStatus, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 ring-amber-100",
  APPROVED: "bg-blue-50 text-blue-700 ring-blue-100",
  REJECTED: "bg-red-50 text-red-700 ring-red-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  CANCELED: "bg-slate-100 text-slate-500 ring-slate-200",
};

export const consultationTopicLabels: Record<ConsultationTopic, string> = {
  STUDY: "학습 상담",
  LIFE: "생활 상담",
  PROGRESS: "진도 상담",
  ETC: "기타",
};

export const consultationTopics: Array<{ value: ConsultationTopic; label: string }> = [
  { value: "STUDY", label: "학습 상담" },
  { value: "LIFE", label: "생활 상담" },
  { value: "PROGRESS", label: "진도 상담" },
  { value: "ETC", label: "기타" },
];

export const consultationAvailabilityDays: Array<{ value: ConsultationAvailabilityDay; shortLabel: string; label: string }> = [
  { value: "MONDAY", shortLabel: "월", label: "월요일" },
  { value: "TUESDAY", shortLabel: "화", label: "화요일" },
  { value: "WEDNESDAY", shortLabel: "수", label: "수요일" },
  { value: "THURSDAY", shortLabel: "목", label: "목요일" },
  { value: "FRIDAY", shortLabel: "금", label: "금요일" },
  { value: "SATURDAY", shortLabel: "토", label: "토요일" },
  { value: "SUNDAY", shortLabel: "일", label: "일요일" },
];

export const consultationAvailabilityTypeLabels: Record<ConsultationAvailabilityType, string> = {
  NEW_STUDENT: "신규생 상담",
  ENROLLED_STUDENT: "재원생 상담",
  ALL: "전체",
};

export const consultationAvailabilityTypes: Array<{ value: ConsultationAvailabilityType; label: string }> = [
  { value: "NEW_STUDENT", label: "신규생 상담" },
  { value: "ENROLLED_STUDENT", label: "재원생 상담" },
  { value: "ALL", label: "전체" },
];

export const consultationTimeSlots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

export const disabledConsultationTimeSlots = ["15:30"];
