import Link from "next/link";
import { HomeAuthActions } from "@/components/auth/HomeAuthActions";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { UserRole } from "@/types/auth";

type RoleDashboardPageProps = {
  role: UserRole;
  title: string;
  description: string;
};

export function RoleDashboardPage({ role, title, description }: RoleDashboardPageProps) {
  return (
    <RoleGuard allowedRole={role}>
      <main className="min-h-screen px-5 py-8 text-slate-900">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-12">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
              Ringdu
            </Link>
            <HomeAuthActions variant="nav" />
          </nav>

          <div className="flex flex-1 items-center">
            <div className="w-full rounded-3xl border border-white/80 bg-white/95 p-8 shadow-2xl shadow-blue-100/70 backdrop-blur">
              <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700 ring-1 ring-blue-100">{role}</p>
              <h1 className="mt-4 text-4xl font-black text-slate-950">{title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
            </div>
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}
