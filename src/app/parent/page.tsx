import { RoleDashboardPage } from "@/components/auth/RoleDashboardPage";

export default function ParentPage() {
  return (
    <RoleDashboardPage
      role="PARENT"
      title="학부모 대시보드"
      description="자녀의 시간표, 출석, 숙제, 청구 정보를 확인하기 위한 임시 화면입니다."
    />
  );
}
