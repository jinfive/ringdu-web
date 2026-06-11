import { TeacherClassHomeworkPage } from "@/components/teacher/homework/TeacherHomeworkPages";

type TeacherClassHomeworkRouteProps = {
  params: Promise<{ classId: string }>;
};

export default async function TeacherClassHomeworkRoute({ params }: TeacherClassHomeworkRouteProps) {
  const { classId } = await params;
  return <TeacherClassHomeworkPage classId={classId} />;
}
