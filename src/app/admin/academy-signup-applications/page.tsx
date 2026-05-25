import { AdminAcademySignupApplications } from "@/components/auth/AdminAcademySignupApplications";
import { AdminPageShell } from "@/components/auth/AdminPageShell";

export default function AdminAcademySignupApplicationsPage() {
  return (
    <AdminPageShell
      title="학원 가입 승인 대기"
      description="직접 가입 신청한 학원 계정을 검토하고 승인합니다."
    >
      <AdminAcademySignupApplications />
    </AdminPageShell>
  );
}
