import { RoleDashboardPage } from "@/components/auth/RoleDashboardPage";

export default function StudentPage() {
  return (
    <RoleDashboardPage
      role="STUDENT"
      title="학생 대시보드"
      description="본인의 일정과 숙제 정보를 확인하기 위한 학생 임시 화면입니다."
    />
  );
}
