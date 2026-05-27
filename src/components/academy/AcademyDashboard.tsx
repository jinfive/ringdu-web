"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, getAcademyDashboard, getMyAcademy } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AcademyDashboardResponse, AcademyResponse } from "@/types/auth";
import { AcademyCard, AcademyLinkButton, AcademyShell, StatusBadge } from "./AcademyShell";

const registrationActions = [
  { href: "/academy/students", label: "학생 등록" },
  { href: "/academy/teachers/new", label: "선생님 초대" },
  { href: "/academy/consultations/new", label: "신규 상담 등록" },
  { href: "/academy/invoices", label: "청구서 생성" },
];

const managementMenus = [
  {
    href: "/academy/students",
    title: "학생 관리",
    description: "학생 정보, 보호자, 수강, 청구서, 재원생 상담을 한곳에서 확인합니다.",
  },
  {
    href: "/academy/teachers",
    title: "선생님 관리",
    description: "소속 선생님과 보낸 초대장 상태를 확인합니다.",
  },
  {
    href: "/academy/schedule",
    title: "시간표 관리",
    description: "요일별 수업을 확인하고 특정 수업 상세로 이동합니다.",
  },
  {
    href: "/academy/consultations",
    title: "신규 상담",
    description: "등록 전 문의와 상담 예약 상태를 관리합니다.",
  },
  {
    href: "/academy/invoices",
    title: "청구서/수납",
    description: "학생별 청구서와 수강료 납부 상태를 확인합니다.",
  },
  {
    href: "/academy/attendance",
    title: "출석 현황",
    description: "클래스별, 학생별 출석 기록과 지각/결석 목록을 조회합니다.",
  },
  {
    href: "/academy/settings",
    title: "학원 설정",
    description: "학원명, 대표 전화번호, 주소, 운영 상태를 관리합니다.",
  },
];

export function AcademyDashboard() {
  const { accessToken, user } = useAuth();
  const isPendingApproval = user?.status === "PENDING_APPROVAL";
  const [academy, setAcademy] = useState<AcademyResponse | null>(null);
  const [dashboard, setDashboard] = useState<AcademyDashboardResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const today = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
  }).format(new Date());

  const loadDashboard = () => {
    if (!accessToken || isPendingApproval) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    void Promise.all([getMyAcademy(accessToken), getAcademyDashboard(accessToken)])
      .then(([academyResponse, dashboardResponse]) => {
        setAcademy(academyResponse);
        setDashboard(dashboardResponse);
      })
      .catch((error) => {
        setErrorMessage(getAcademyErrorMessage(error, "학원 대시보드 정보를 불러오지 못했습니다."));
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    if (!accessToken || isPendingApproval) {
      return;
    }

    let isMounted = true;
    void Promise.all([getMyAcademy(accessToken), getAcademyDashboard(accessToken)])
      .then(([academyResponse, dashboardResponse]) => {
        if (isMounted) {
          setAcademy(academyResponse);
          setDashboard(dashboardResponse);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getAcademyErrorMessage(error, "학원 대시보드 정보를 불러오지 못했습니다."));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, isPendingApproval]);

  const summaryItems = useMemo(() => {
    const data = dashboard ?? {
      studentCount: 0,
      teacherCount: 0,
      unpaidInvoiceCount: 0,
      pendingConsultationCount: 0,
    };

    return [
      { label: "등록 학생", value: `${data.studentCount}명` },
      { label: "등록 선생님", value: `${data.teacherCount}명` },
      { label: "이번 달 미납", value: `${data.unpaidInvoiceCount}건` },
      { label: "신규 상담 대기", value: `${data.pendingConsultationCount}건` },
    ];
  }, [dashboard]);

  return (
    <AcademyShell
      title="학원 홈"
      description="오늘의 운영 현황을 확인하세요."
      actions={<AcademyLinkButton href="/academy/students">학생 등록</AcademyLinkButton>}
    >
      <div className="space-y-8">
        <AcademyCard>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <StatusBadge>{academy?.status === "ACTIVE" ? "운영 중" : "정보 확인 중"}</StatusBadge>
              <h2 className="mt-3 text-2xl font-bold text-slate-950">학원 운영자 홈</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">{today}</p>
            </div>
            <div className="rounded-md bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">{academy?.name ?? "학원 정보 로딩 중"}</p>
              <p className="mt-1">{academy?.representativeName ? `대표자 ${academy.representativeName}` : "내 학원 정보를 확인하고 있습니다."}</p>
            </div>
          </div>
        </AcademyCard>

        {isLoading ? (
          <AcademyCard>
            <p className="text-sm font-semibold text-slate-600">학원 대시보드 정보를 불러오고 있습니다.</p>
          </AcademyCard>
        ) : null}

        {errorMessage ? (
          <AcademyCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
              <button
                type="button"
                onClick={loadDashboard}
                className="inline-flex h-10 items-center justify-center rounded-md border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                다시 시도
              </button>
            </div>
          </AcademyCard>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <AcademyCard key={item.label}>
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-slate-950">{item.value}</p>
            </AcademyCard>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AcademyCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">미처리 알림</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  운영자가 확인해야 할 요청과 수납 관련 항목입니다.
                </p>
              </div>
              <StatusBadge>{dashboard?.notifications.length ?? 0}건</StatusBadge>
            </div>
            <div className="mt-5 space-y-3">
              {dashboard && dashboard.notifications.length > 0 ? (
                dashboard.notifications.map((notification) => (
                  <Link
                    key={`${notification.title}-${notification.targetPath}`}
                    href={notification.targetPath}
                    className="block rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="font-bold text-slate-900">{notification.title}</span>
                    <span className="mt-1 block">{notification.message}</span>
                  </Link>
                ))
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  확인할 미처리 알림이 없습니다.
                </div>
              )}
            </div>
          </AcademyCard>

          <AcademyCard>
            <h2 className="text-xl font-bold text-slate-950">등록</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              자주 필요한 등록 작업으로 바로 이동합니다.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {registrationActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-md border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </AcademyCard>
        </div>

        <section>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">주요 관리 메뉴</h2>
              <p className="mt-2 text-sm text-slate-600">학원 운영 흐름에 맞춘 핵심 화면입니다.</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {managementMenus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <h3 className="text-lg font-bold text-slate-950">{menu.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{menu.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AcademyShell>
  );
}

function getAcademyErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return fallback;
}
