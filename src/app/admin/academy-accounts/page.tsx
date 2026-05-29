import Link from "next/link";
import { AdminPageShell } from "@/components/auth/AdminPageShell";

export default function AdminAcademyAccountsPage() {
  return (
    <AdminPageShell
      title="학원 계정 관리"
      description="현재 단계에서는 ADMIN의 학원 계정 생성 기능만 제공합니다."
    >
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-blue-100/60">
        <h2 className="text-xl font-bold text-slate-950">학원 계정</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          목록 조회와 학원 상세 관리는 다음 학원 도메인 작업에서 구현합니다.
        </p>
        <Link
          href="/admin/academy-accounts/new"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-blue-700 px-5 text-base font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800"
        >
          학원 계정 생성
        </Link>
      </div>
    </AdminPageShell>
  );
}
