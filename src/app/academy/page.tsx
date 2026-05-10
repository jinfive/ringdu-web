import { RoleDashboardPage } from "@/components/auth/RoleDashboardPage";

export default function AcademyPage() {
  return (
    <RoleDashboardPage
      role="ACADEMY"
      title="학원 대시보드"
      description="학원 운영 현황과 선생, 학생, 클래스 관리를 위한 임시 화면입니다."
    />
  );
}
