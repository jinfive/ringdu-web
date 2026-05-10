import { RoleDashboardPage } from "@/components/auth/RoleDashboardPage";

export default function TeacherPage() {
  return (
    <RoleDashboardPage
      role="TEACHER"
      title="선생님 대시보드"
      description="수업, 출석, 숙제 관리를 위한 선생님 임시 화면입니다."
    />
  );
}
