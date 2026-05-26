import { AcademyScheduleDetailPage } from "@/components/academy/AcademyPages";

type ScheduleDetailPageProps = {
  params: Promise<{
    classId: string;
  }>;
};

export default async function ScheduleDetailPage({ params }: ScheduleDetailPageProps) {
  const { classId } = await params;
  return <AcademyScheduleDetailPage classId={classId} />;
}
