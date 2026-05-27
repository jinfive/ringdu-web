import Link from "next/link";
import type { ReactNode } from "react";
import { HomeAuthActions } from "@/components/auth/HomeAuthActions";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/auth/AuthProvider";

type AcademyShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  actions?: ReactNode;
};

const academyMenu = [
  { href: "/academy", label: "학원 홈" },
  { href: "/academy/students", label: "학생 관리" },
  { href: "/academy/teachers", label: "선생님 관리" },
  { href: "/academy/schedule", label: "시간표 관리" },
  { href: "/academy/consultations", label: "신규 상담" },
  { href: "/academy/invoices", label: "청구서/수납" },
  { href: "/academy/attendance", label: "출석 현황" },
  { href: "/academy/settings", label: "학원 설정" },
];

export function AcademyShell({ title, description, children, actions }: AcademyShellProps) {
  const { user, loadMe, logout, isLoading } = useAuth();
  const isPendingApproval = user?.role === "ACADEMY" && user.status === "PENDING_APPROVAL";

  if (isPendingApproval) {
    return (
      <RoleGuard allowedRole="ACADEMY">
        <main className="min-h-screen bg-slate-50 text-slate-950">
          <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col">
            <header className="border-b border-slate-200 bg-white px-5 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href="/" className="text-xl font-bold tracking-tight text-blue-700">
                    Ringdu
                  </Link>
                  <p className="mt-2 text-sm font-semibold text-amber-700">학원 승인 대기</p>
                </div>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  로그아웃
                </button>
              </div>
            </header>

            <section className="flex flex-1 items-center justify-center px-5 py-10">
              <div className="w-full max-w-2xl rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
                <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                  승인 대기
                </span>
                <h1 className="mt-4 text-2xl font-bold text-slate-950">관리자 승인 대기 중입니다.</h1>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  학원 계정 신청이 접수되었습니다.
                  <br />
                  관리자 승인 후 학원 관리 기능을 사용할 수 있습니다.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => void loadMe()}
                    disabled={isLoading}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {isLoading ? "확인 중" : "새로고침"}
                  </button>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard allowedRole="ACADEMY">
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
          <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:block">
            <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
              Ringdu
            </Link>
            <p className="mt-2 text-sm font-medium text-slate-500">학원 운영</p>
            <nav className="mt-8 space-y-1">
              {academyMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <Link href="/" className="text-xl font-bold tracking-tight text-blue-700 lg:hidden">
                    Ringdu
                  </Link>
                  <p className="mt-2 text-xs font-semibold uppercase text-blue-600 lg:mt-0">ACADEMY</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-950">{title}</h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {actions}
                  <HomeAuthActions variant="nav" />
                </div>
              </div>
              <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {academyMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="shrink-0 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </header>

            <div className="flex-1 px-5 py-6 pb-24 lg:px-8 lg:py-8">{children}</div>

            <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 shadow-2xl shadow-slate-300/50 lg:hidden">
              {academyMenu.slice(0, 4).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-2 py-2 text-center text-xs font-semibold text-slate-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </main>
    </RoleGuard>
  );
}

export function AcademyCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </section>
  );
}

export function AcademyLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
    >
      {children}
    </Link>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatusBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
      {children}
    </span>
  );
}

export function FieldPreview({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function TabPreview({ tabs }: { tabs: string[] }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {tabs.map((tab) => (
        <span
          key={tab}
          className="shrink-0 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
        >
          {tab}
        </span>
      ))}
    </div>
  );
}
