import { AcademyStudentDetailPage } from "@/components/academy/AcademyPages";

type StudentDetailPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

export default async function StudentDetailPage({ params }: StudentDetailPageProps) {
  const { studentId } = await params;
  return <AcademyStudentDetailPage studentId={studentId} />;
}
