"use client";

import Link from "next/link";
import { getRoleHomeLabel, getRoleHomePath } from "@/lib/roles";
import { useAuth } from "./AuthProvider";

type HomeAuthActionsProps = {
  variant: "nav" | "hero";
};

export function HomeAuthActions({ variant }: HomeAuthActionsProps) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (variant === "nav") {
    if (isLoading) {
      return <span className="text-sm font-semibold text-slate-400">확인 중</span>;
    }

    if (isAuthenticated && user) {
      return (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm font-semibold text-slate-600 sm:inline">
            {user.name}님
          </span>
          <Link
            href={getRoleHomePath(user.role)}
            className="rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            {getRoleHomeLabel(user.role)}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
          >
            로그아웃
          </button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
        >
          회원가입
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <span className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-base font-semibold text-slate-400">
          인증 상태 확인 중
        </span>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={getRoleHomePath(user.role)}
          className="inline-flex h-12 items-center justify-center rounded-md bg-blue-700 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          {getRoleHomeLabel(user.role)}
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <Link
        href="/signup"
        className="inline-flex h-12 items-center justify-center rounded-md bg-blue-700 px-6 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800"
      >
        회원가입 시작하기
      </Link>
      <Link
        href="/login"
        className="inline-flex h-12 items-center justify-center rounded-md border border-slate-200 bg-white px-6 text-base font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
      >
        로그인
      </Link>
    </div>
  );
}
