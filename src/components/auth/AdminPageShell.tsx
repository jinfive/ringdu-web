import Link from "next/link";
import { HomeAuthActions } from "@/components/auth/HomeAuthActions";
import { RoleGuard } from "@/components/auth/RoleGuard";
import type { ReactNode } from "react";

type AdminPageShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AdminPageShell({ title, description, children }: AdminPageShellProps) {
  return (
    <RoleGuard allowedRole="ADMIN">
      <main className="min-h-screen px-5 py-8 text-slate-900">
        <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col gap-10">
          <nav className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
              Ringdu
            </Link>
            <HomeAuthActions variant="nav" />
          </nav>

          <header>
            <p className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700 ring-1 ring-blue-100">ADMIN</p>
            <h1 className="mt-4 text-4xl font-black text-slate-950">{title}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
          </header>

          {children}
        </section>
      </main>
    </RoleGuard>
  );
}
