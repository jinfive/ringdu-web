import Link from "next/link";
import { AdminPageShell } from "@/components/auth/AdminPageShell";

export default function AdminPage() {
  return (
    <AdminPageShell
      title="관리자 대시보드"
      description="Ringdu 플랫폼 운영과 학원 계정 관리를 위한 관리자 화면입니다."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/admin/academy-accounts"
          className="rounded-lg border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60 transition hover:border-blue-300 hover:bg-blue-50"
        >
          <p className="text-sm font-semibold uppercase text-blue-600">Academy Accounts</p>
          <h2 className="mt-3 text-xl font-bold text-slate-950">학원 계정 관리</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            ADMIN이 생성한 학원 계정 관리 화면으로 이동합니다.
          </p>
        </Link>
        <Link
          href="/admin/academy-accounts/new"
          className="rounded-lg border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60 transition hover:border-blue-300 hover:bg-blue-50"
        >
          <p className="text-sm font-semibold uppercase text-blue-600">Create</p>
          <h2 className="mt-3 text-xl font-bold text-slate-950">학원 계정 생성</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            새 ACADEMY 계정을 생성합니다. 실제 학원 정보 관리는 다음 단계에서 다룹니다.
          </p>
        </Link>
      </div>
    </AdminPageShell>
  );
}
