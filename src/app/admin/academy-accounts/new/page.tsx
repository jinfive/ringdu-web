import { AdminAcademyAccountForm } from "@/components/auth/AdminAcademyAccountForm";
import { AdminPageShell } from "@/components/auth/AdminPageShell";

export default function NewAdminAcademyAccountPage() {
  return (
    <AdminPageShell
      title="학원 계정 생성"
      description="ADMIN 권한으로 ACADEMY 역할의 사용자 계정을 생성합니다."
    >
      <AdminAcademyAccountForm />
    </AdminPageShell>
  );
}
