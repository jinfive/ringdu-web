export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "EXCUSED";

export type AttendanceStudent = {
  studentId: string;
  name: string;
  school: string;
  grade: string;
};

export type AttendanceClass = {
  classId: string;
  className: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  studentCount: number;
  teacherName: string;
  students: AttendanceStudent[];
};

export type AttendanceRecord = {
  id: string;
  classId: string;
  className: string;
  date: string;
  studentId: string;
  studentName: string;
  status: AttendanceStatus;
  memo: string;
};

export const attendanceStatusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "출석",
  LATE: "지각",
  ABSENT: "결석",
  EXCUSED: "인정결석",
};

export const attendanceStatusStyles: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  LATE: "bg-amber-50 text-amber-700 ring-amber-100",
  ABSENT: "bg-red-50 text-red-700 ring-red-100",
  EXCUSED: "bg-blue-50 text-blue-700 ring-blue-100",
};

export const mockAttendanceClasses: AttendanceClass[] = [
  {
    classId: "sample-class",
    className: "수학 A반",
    dayLabel: "월",
    startTime: "16:00",
    endTime: "17:30",
    studentCount: 5,
    teacherName: "담당 선생님",
    students: [
      { studentId: "student-1", name: "김학생", school: "동신중", grade: "2" },
      { studentId: "student-2", name: "이학생", school: "동신중", grade: "2" },
      { studentId: "student-3", name: "박학생", school: "동신중", grade: "1" },
      { studentId: "student-4", name: "최학생", school: "동신중", grade: "3" },
      { studentId: "student-5", name: "정학생", school: "동신중", grade: "2" },
    ],
  },
  {
    classId: "science-b",
    className: "과학 B반",
    dayLabel: "월",
    startTime: "18:00",
    endTime: "19:20",
    studentCount: 4,
    teacherName: "담당 선생님",
    students: [
      { studentId: "student-6", name: "한학생", school: "서연중", grade: "1" },
      { studentId: "student-7", name: "오학생", school: "서연중", grade: "1" },
      { studentId: "student-8", name: "윤학생", school: "서연중", grade: "2" },
      { studentId: "student-9", name: "임학생", school: "서연중", grade: "2" },
    ],
  },
];

export const mockAttendanceRecords: AttendanceRecord[] = [
  {
    id: "record-1",
    classId: "sample-class",
    className: "수학 A반",
    date: "2026-06-01",
    studentId: "student-1",
    studentName: "김학생",
    status: "PRESENT",
    memo: "정상 출석",
  },
  {
    id: "record-2",
    classId: "sample-class",
    className: "수학 A반",
    date: "2026-06-01",
    studentId: "student-2",
    studentName: "이학생",
    status: "LATE",
    memo: "10분 지각",
  },
  {
    id: "record-3",
    classId: "sample-class",
    className: "수학 A반",
    date: "2026-06-01",
    studentId: "student-3",
    studentName: "박학생",
    status: "ABSENT",
    memo: "연락 필요",
  },
  {
    id: "record-4",
    classId: "science-b",
    className: "과학 B반",
    date: "2026-05-29",
    studentId: "student-6",
    studentName: "한학생",
    status: "EXCUSED",
    memo: "학교 행사",
  },
];

export function countAttendanceStatuses(records: AttendanceRecord[]) {
  return records.reduce<Record<AttendanceStatus, number>>(
    (acc, record) => {
      acc[record.status] += 1;
      return acc;
    },
    { PRESENT: 0, LATE: 0, ABSENT: 0, EXCUSED: 0 },
  );
}
