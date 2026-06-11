export type HomeworkTargetType = "CLASS" | "INDIVIDUAL";

export type HomeworkStatus = "ASSIGNED" | "DONE" | "NOT_DONE" | "CHECKED";

export type HomeworkStudent = {
  studentProfileId: number;
  studentName: string;
};

export type HomeworkClass = {
  classId: number;
  className: string;
  dayLabel: string;
  startTime: string;
  endTime: string;
  classroomName: string;
  students: HomeworkStudent[];
};

export type HomeworkAssignment = {
  homeworkId: number;
  classId: number;
  className: string;
  title: string;
  content: string;
  dueDate: string;
  targetType: HomeworkTargetType;
  targetStudentIds: number[];
  memo?: string;
  createdAt: string;
};

export type HomeworkStudentStatus = {
  homeworkId: number;
  studentProfileId: number;
  studentName: string;
  status: HomeworkStatus;
  memo?: string;
};

export const homeworkStatusLabels: Record<HomeworkStatus, string> = {
  ASSIGNED: "확인 전",
  DONE: "해옴",
  NOT_DONE: "안 해옴",
  CHECKED: "확인 완료",
};

export const homeworkStatusStyles: Record<HomeworkStatus, string> = {
  ASSIGNED: "bg-slate-100 text-slate-600 ring-slate-200",
  DONE: "bg-blue-50 text-blue-700 ring-blue-100",
  NOT_DONE: "bg-red-50 text-red-700 ring-red-100",
  CHECKED: "bg-emerald-50 text-emerald-700 ring-emerald-100",
};
