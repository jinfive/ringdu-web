export type ScheduleDay = "월" | "화" | "수" | "목" | "금" | "토" | "일";

export type Classroom = {
  id: string;
  name: string;
};

export type ScheduleClass = {
  id: string;
  title: string;
  dayOfWeek: ScheduleDay;
  startTime: string;
  endTime: string;
  classroomId: string;
  teacher: string;
  memo: string;
};
