export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT";
export type AttendanceSessionStatus = "OPEN" | "COMPLETED";

export type TeacherTodayClassResponse = {
  classId: number;
  className: string;
  dayOfWeek: string;
  dayLabel: string;
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

export const mockStudentAttendanceRecords: AttendanceRecordListItem[] = [
  {
    id: "student-attendance-1",
    attendanceDate: "2026-06-01",
    academyId: "academy-1",
    academyName: "링듀수학학원",
    className: "중등 수학 A반",
    status: "PRESENT",
    memo: "정상 출석",
  },
  {
    id: "student-attendance-2",
    attendanceDate: "2026-06-03",
    academyId: "academy-1",
    academyName: "링듀수학학원",
    className: "중등 수학 A반",
    status: "LATE",
    memo: "10분 지각",
  },
  {
    id: "student-attendance-3",
    attendanceDate: "2026-05-27",
    academyId: "academy-2",
    academyName: "링듀영어학원",
    className: "영어 독해 B반",
    status: "ABSENT",
    memo: "결석",
  },
];

export const mockParentAttendanceRecords: AttendanceRecordListItem[] = [
  {
    id: "parent-attendance-1",
    attendanceDate: "2026-06-01",
    studentId: "student-1",
    studentName: "김학생",
    academyId: "academy-1",
    academyName: "링듀수학학원",
    className: "중등 수학 A반",
    status: "PRESENT",
    memo: "정상 출석",
  },
  {
    id: "parent-attendance-2",
    attendanceDate: "2026-06-03",
    studentId: "student-1",
    studentName: "김학생",
    academyId: "academy-1",
    academyName: "링듀수학학원",
    className: "중등 수학 A반",
    status: "LATE",
    memo: "10분 지각",
  },
  {
    id: "parent-attendance-3",
    attendanceDate: "2026-05-29",
    studentId: "student-2",
    studentName: "이학생",
    academyId: "academy-2",
    academyName: "링듀영어학원",
    className: "영어 독해 B반",
    status: "ABSENT",
    memo: "결석",
  },
];

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
