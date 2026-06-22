export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";
export type AttendanceSessionStatus = "OPEN" | "COMPLETED";

export type TeacherTodayClassResponse = {
  classId: number;
  className: string;
  dayOfWeek: string;
  dayOfWeeks?: string[];
  dayLabel: string;
  dayLabels?: string[];
  startTime: string;
  endTime: string;
  classroomName: string;
  studentCount: number;
  attendanceSessionId: number | null;
  attendanceStatus: AttendanceSessionStatus | null;
};

export type AttendanceRecordResponse = {
  recordId: number;
  studentProfileId: number;
  studentName: string;
  status: AttendanceStatus;
  memo: string;
};

export type AttendanceSessionDetailResponse = {
  attendanceSessionId: number;
  classId: number;
  className: string;
  attendanceDate: string;
  status: AttendanceSessionStatus;
  records: AttendanceRecordResponse[];
};

export type AttendanceRecordSaveRequest = {
  records: Array<{
    studentProfileId: number;
    status: AttendanceStatus;
    memo: string;
  }>;
};

export type AcademyAttendanceSessionSummaryResponse = {
  attendanceSessionId: number;
  classId: number;
  className: string;
  attendanceDate: string;
  status: AttendanceSessionStatus;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  totalCount: number;
};

export type AcademyStudentAttendanceRecordResponse = {
  attendanceSessionId: number;
  recordId: number;
  classId: number;
  className: string;
  attendanceDate: string;
  status: AttendanceStatus;
  memo: string;
};

export type AttendanceAcademyOptionResponse = {
  academyId: number;
  academyName: string;
};

export type StudentAttendanceRecordResponse = {
  attendanceDate: string;
  academyId: number;
  academyName: string;
  classId: number;
  className: string;
  status: AttendanceStatus;
  statusLabel: string;
  memo: string | null;
};

export type ParentChildAttendanceRecordResponse = StudentAttendanceRecordResponse & {
  studentProfileId: number;
  studentName: string;
};

export type AttendanceRecordListItem = {
  id: string;
  attendanceDate: string;
  academyId: string;
  academyName: string;
  className: string;
  status: AttendanceStatus;
  memo: string;
  studentId?: string;
  studentName?: string;
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "출석",
  LATE: "지각",
  ABSENT: "결석",
};

export const attendanceStatusStyles: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  LATE: "bg-amber-50 text-amber-700 ring-amber-100",
  ABSENT: "bg-red-50 text-red-700 ring-red-100",
};

export const attendanceSessionStatusLabels: Record<AttendanceSessionStatus, string> = {
  OPEN: "출석 처리 대기",
  COMPLETED: "처리 완료",
};

export const attendanceYearOptions = [2024, 2025, 2026, 2027];
export const attendanceMonthOptions = Array.from({ length: 12 }, (_, index) => index + 1);

export function countAttendanceStatuses(records: AttendanceRecordResponse[]) {
  return records.reduce<Record<AttendanceStatus, number>>(
    (acc, record) => {
      acc[record.status] += 1;
      return acc;
    },
    { PRESENT: 0, LATE: 0, ABSENT: 0 },
  );
}

export function getCurrentAttendanceFilter() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export function isSameAttendanceMonth(attendanceDate: string, year: number, month: number) {
  const [recordYear, recordMonth] = attendanceDate.split("-").map(Number);
  return recordYear === year && recordMonth === month;
}
