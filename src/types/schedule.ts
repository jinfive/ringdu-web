export type ScheduleStatus = "ACTIVE" | "INACTIVE";

export type ScheduleDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type AcademyClassroomResponse = {
  classroomId: number;
  name: string;
  status: ScheduleStatus;
  displayOrder: number;
};

export type AcademyClassroomRequest = {
  name: string;
};

export type AcademyClassRequest = {
  name: string;
  dayOfWeek: ScheduleDayOfWeek;
  classroomId: number;
  teacherUserId?: number | null;
  startTime: string;
  endTime: string;
  memo?: string | null;
};

export type AcademyClassResponse = {
  classId: number;
  name: string;
  dayOfWeek: ScheduleDayOfWeek;
  dayLabel: string;
  classroomId: number;
  classroomName: string;
  teacherUserId: number | null;
  teacherName: string | null;
  startTime: string;
  endTime: string;
  memo: string | null;
  studentCount: number;
  status: ScheduleStatus;
};

export type AcademyClassStudentResponse = {
  studentProfileId: number;
  name: string;
  school: string | null;
  grade: string | null;
};

export type AcademyClassStudentRequest = {
  studentProfileId: number;
};

export type AcademyClassDetailResponse = AcademyClassResponse & {
  students: AcademyClassStudentResponse[];
};

export type AcademyClassListQuery = {
  dayOfWeek?: ScheduleDayOfWeek;
  classroomId?: number;
  status?: ScheduleStatus;
};
