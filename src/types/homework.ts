export type HomeworkTargetType = "CLASS" | "INDIVIDUAL";
export type HomeworkStudentStatus = "DONE" | "NOT_DONE";

export type HomeworkStudent = {
  studentProfileId: number;
  studentName: string;
};

export type TeacherHomeworkClass = {
  classId: number;
  academyId: number;
  academyName: string;
  className: string;
  dayOfWeek: string;
  dayOfWeeks?: string[];
  dayLabel: string;
  dayLabels?: string[];
  startTime: string;
  endTime: string;
  classroomName: string;
  studentCount: number;
  students: HomeworkStudent[];
};

export type HomeworkCreateRequest = {
  title: string;
  content: string;
  dueDate: string;
  targetType: HomeworkTargetType;
  studentProfileIds: number[];
  memo?: string | null;
};

export type HomeworkSummary = {
  homeworkId: number;
  classId: number;
  className: string;
  title: string;
  content: string;
  dueDate: string;
  targetType: HomeworkTargetType;
  assignedCount: number;
  doneCount: number;
  notDoneCount: number;
  memo?: string | null;
};

export type HomeworkStudentItem = {
  homeworkStudentId: number;
  studentProfileId: number;
  studentName: string;
  status: HomeworkStudentStatus;
  statusLabel: string;
  memo?: string | null;
};

export type HomeworkDetail = {
  homeworkId: number;
  classId: number;
  className: string;
  title: string;
  content: string;
  dueDate: string;
  targetType: HomeworkTargetType;
  memo?: string | null;
  students: HomeworkStudentItem[];
};

export type HomeworkInquiryItem = {
  homeworkId: number;
  homeworkStudentId: number;
  studentProfileId: number;
  studentName: string;
  academyId: number;
  academyName: string;
  classId: number;
  className: string;
  title: string;
  content: string;
  dueDate: string;
  status: HomeworkStudentStatus;
  statusLabel: string;
  memo?: string | null;
};

export type HomeworkInquiryQuery = {
  status?: HomeworkStudentStatus | "ALL";
  from?: string;
  to?: string;
};

export const homeworkStatusLabels: Record<HomeworkStudentStatus, string> = {
  DONE: "해옴",
  NOT_DONE: "안해옴",
};

export const homeworkStatusStyles: Record<HomeworkStudentStatus, string> = {
  DONE: "bg-blue-50 text-blue-700 ring-blue-100",
  NOT_DONE: "bg-red-50 text-red-700 ring-red-100",
};
