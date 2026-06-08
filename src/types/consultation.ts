export type ConsultationStatus = "REQUESTED" | "APPROVED" | "REJECTED" | "COMPLETED";

export type ConsultationTopic = "학습 상담" | "생활 상담" | "진도 상담" | "기타";

export type ConsultationRequestType = "신규 상담" | "재원생 상담";

export type ConsultationAvailabilityDay = "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";

export type ConsultationAvailabilityType = "신규생 상담" | "재원생 상담" | "전체";

export type ConsultationAvailabilitySlot = {
  id: string;
  dayOfWeek: ConsultationAvailabilityDay;
  startTime: string;
  endTime: string;
  type: ConsultationAvailabilityType;
  active: boolean;
};

export type ConsultationRequest = {
  id: string;
  type: ConsultationRequestType;
  studentName: string;
  guardianPhone: string;
  academyName: string;
  teacherName?: string;
  className?: string;
  subject?: string;
  topic: ConsultationTopic | "입학 상담";
  preferredDate: string;
  preferredTime: string;
  message: string;
  status: ConsultationStatus;
};

export const consultationStatusLabels: Record<ConsultationStatus, string> = {
  REQUESTED: "요청됨",
  APPROVED: "승인됨",
  REJECTED: "거절됨",
  COMPLETED: "완료됨",
};

export const consultationStatusStyles: Record<ConsultationStatus, string> = {
  REQUESTED: "bg-amber-50 text-amber-700 ring-amber-100",
  APPROVED: "bg-blue-50 text-blue-700 ring-blue-100",
  REJECTED: "bg-red-50 text-red-700 ring-red-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};

export const consultationTopics: ConsultationTopic[] = ["학습 상담", "생활 상담", "진도 상담", "기타"];

export const consultationAvailabilityDays: Array<{ value: ConsultationAvailabilityDay; shortLabel: string; label: string }> = [
  { value: "MONDAY", shortLabel: "월", label: "월요일" },
  { value: "TUESDAY", shortLabel: "화", label: "화요일" },
  { value: "WEDNESDAY", shortLabel: "수", label: "수요일" },
  { value: "THURSDAY", shortLabel: "목", label: "목요일" },
  { value: "FRIDAY", shortLabel: "금", label: "금요일" },
  { value: "SATURDAY", shortLabel: "토", label: "토요일" },
  { value: "SUNDAY", shortLabel: "일", label: "일요일" },
];

export const consultationAvailabilityTypes: ConsultationAvailabilityType[] = ["신규생 상담", "재원생 상담", "전체"];

export const mockConsultationAvailabilitySlots: ConsultationAvailabilitySlot[] = [
  {
    id: "availability-1",
    dayOfWeek: "MONDAY",
    startTime: "14:00",
    endTime: "14:30",
    type: "전체",
    active: true,
  },
  {
    id: "availability-2",
    dayOfWeek: "MONDAY",
    startTime: "15:00",
    endTime: "15:30",
    type: "신규생 상담",
    active: true,
  },
  {
    id: "availability-3",
    dayOfWeek: "TUESDAY",
    startTime: "16:00",
    endTime: "16:30",
    type: "재원생 상담",
    active: true,
  },
  {
    id: "availability-4",
    dayOfWeek: "TUESDAY",
    startTime: "17:00",
    endTime: "17:30",
    type: "전체",
    active: false,
  },
];

export const consultationTimeSlots = ["14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];

export const disabledConsultationTimeSlots = ["15:30"];

export const mockConsultationRequests: ConsultationRequest[] = [
  {
    id: "new-1",
    type: "신규 상담",
    studentName: "박예비",
    guardianPhone: "010-4422-1201",
    academyName: "지누수학",
    subject: "중등 수학",
    topic: "입학 상담",
    preferredDate: "2026-06-05",
    preferredTime: "14:30",
    message: "중학교 1학년 수학 선행 상담을 받고 싶습니다.",
    status: "REQUESTED",
  },
  {
    id: "enrolled-1",
    type: "재원생 상담",
    studentName: "김학생",
    guardianPhone: "010-1188-5522",
    academyName: "지누수학",
    teacherName: "김선생",
    className: "중등 수학 A반",
    topic: "진도 상담",
    preferredDate: "2026-06-06",
    preferredTime: "16:00",
    message: "최근 단원 이해도와 다음 달 진도 계획을 상담하고 싶습니다.",
    status: "APPROVED",
  },
];
