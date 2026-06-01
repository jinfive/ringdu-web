import { TeacherAttendanceDetailPage } from "@/components/teacher/TeacherPages";

type TeacherAttendanceDetailRouteProps = {
  params: Promise<{ classId: string }>;
};

export default async function TeacherAttendanceDetailRoute({ params }: TeacherAttendanceDetailRouteProps) {
  const { classId } = await params;

  return <TeacherAttendanceDetailPage classId={classId} />;
}
