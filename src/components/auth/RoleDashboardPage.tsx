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
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#e5edff_0,#f7f9ff_34%,#ffffff_100%)] px-5 py-8 text-slate-900">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-12">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
              Ringdu
            </Link>
            <HomeAuthActions variant="nav" />
          </nav>

          <div className="flex flex-1 items-center">
            <div className="w-full rounded-lg border border-blue-100 bg-white p-8 shadow-xl shadow-blue-100/60">
              <p className="text-sm font-semibold uppercase text-blue-600">{role}</p>
              <h1 className="mt-3 text-3xl font-bold text-slate-950">{title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
            </div>
          </div>
        </section>
      </main>
    </RoleGuard>
  );
}
