"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/types/auth";
import { useAuth } from "./AuthProvider";

type RoleGuardProps = {
  allowedRole: UserRole;
  children: ReactNode;
};

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== allowedRole) {
      router.replace("/unauthorized");
    }
  }, [allowedRole, isAuthenticated, isLoading, router, user]);

  if (isLoading) {
    return <GuardStatus message="인증 상태를 확인하고 있습니다." />;
  }

  if (!isAuthenticated || !user || user.role !== allowedRole) {
    return <GuardStatus message="페이지 접근 권한을 확인하고 있습니다." />;
  }

  return children;
}

function GuardStatus({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e9efff_0,#f7f9ff_42%,#ffffff_100%)] px-5 py-8 text-slate-900">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center justify-center">
        <p className="rounded-md border border-blue-100 bg-white px-5 py-4 text-sm font-semibold text-slate-600 shadow-lg shadow-blue-100/50">
          {message}
        </p>
      </section>
    </main>
  );
}
