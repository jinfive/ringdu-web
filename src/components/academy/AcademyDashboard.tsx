"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ApiError, getAcademyConsultationRequests, getAcademyDashboard, getMyAcademy } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AcademyDashboardResponse, AcademyResponse } from "@/types/auth";
import {
  consultationStatusLabels,
  consultationStatusStyles,
  type ConsultationRequestResponse,
  type ConsultationStatus,
} from "@/types/consultation";
import { AcademyCard, AcademyLinkButton, AcademyShell, StatusBadge } from "./AcademyShell";

const registrationActions = [
  { href: "/academy/students", label: "학생 등록" },
  { href: "/academy/teachers/new", label: "선생님 초대" },
];

const managementMenus = [
  {
    href: "/academy/students",
    title: "학생 관리",
    description: "학생 정보, 수강 수업, 상담 메모, 청구/수납을 한 곳에서 관리합니다.",
  },
  {
    href: "/academy/teachers",
    title: "선생님 관리",
    description: "소속 선생님과 보낸 초대장 상태를 확인합니다.",
  },
  {
    href: "/academy/schedule",
    title: "시간표 관리",
    description: "요일과 강의실 기준으로 수업을 배치합니다.",
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
  const [todayConsultations, setTodayConsultations] = useState<ConsultationRequestResponse[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const todayKey = toDateKey(new Date());

  const today = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "full",
  }).format(new Date());

  const loadDashboard = () => {
    if (!accessToken || isPendingApproval) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    void Promise.all([
      getMyAcademy(accessToken),
      getAcademyDashboard(accessToken),
      getAcademyConsultationRequests(accessToken, {
        from: todayKey,
        to: todayKey,
      }),
    ])
      .then(([academyResponse, dashboardResponse, consultationResponse]) => {
        setAcademy(academyResponse);
        setDashboard(dashboardResponse);
        setTodayConsultations(filterTodayConsultations(consultationResponse));
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
    void Promise.all([
      getMyAcademy(accessToken),
      getAcademyDashboard(accessToken),
      getAcademyConsultationRequests(accessToken, {
        from: todayKey,
        to: todayKey,
      }),
    ])
      .then(([academyResponse, dashboardResponse, consultationResponse]) => {
        if (isMounted) {
          setAcademy(academyResponse);
          setDashboard(dashboardResponse);
          setTodayConsultations(filterTodayConsultations(consultationResponse));
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
  }, [accessToken, isPendingApproval, todayKey]);

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
      { label: "학생 중심 관리", value: "상세 통합" },
      { label: "시간표 기준", value: "요일/강의실" },
    ];
  }, [dashboard]);

  return (
    <AcademyShell
      title="학원 홈"
      description="오늘의 운영 현황을 확인하세요."
      actions={<AcademyLinkButton href="/academy/students">학생 등록</AcademyLinkButton>}
    >
      <div className="space-y-8">
        <AcademyCard className="overflow-hidden">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <StatusBadge>{academy?.status === "ACTIVE" ? "운영 중" : "정보 확인 중"}</StatusBadge>
              <h2 className="mt-3 text-3xl font-black text-slate-950">학원 운영자 홈</h2>
              <p className="mt-2 text-sm font-medium text-slate-600">{today}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
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
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                다시 시도
              </button>
            </div>
          </AcademyCard>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryItems.map((item) => (
            <AcademyCard key={item.label} className="transition hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-100/60">
              <p className="text-sm font-semibold text-slate-500">{item.label}</p>
              <p className="mt-3 text-4xl font-black text-slate-950">{item.value}</p>
            </AcademyCard>
          ))}
        </section>

        <AcademyCard>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">오늘 상담 예약</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                오늘 예정된 재원생 상담 요청과 승인 일정을 확인합니다.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <StatusBadge>{todayConsultations.length}건</StatusBadge>
              <Link
                href="/academy/consultations"
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                상담 예약 보기
              </Link>
            </div>
          </div>
          {todayConsultations.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-6 text-center text-sm font-semibold text-slate-500">
              오늘 예정된 상담이 없습니다.
            </p>
          ) : (
            <div className="mt-5 grid gap-3">
              {todayConsultations.map((consultation) => (
                <Link
                  key={consultation.consultationRequestId}
                  href="/academy/consultations"
                  className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 sm:grid-cols-[0.8fr_1fr_1fr_auto] sm:items-center"
                >
                  <span className="font-black text-slate-950">
                    {normalizeTime(consultation.requestedStartTime)} - {normalizeTime(consultation.requestedEndTime)}
                  </span>
                  <span className="font-bold text-slate-900">{consultation.studentName}</span>
                  <span className="font-semibold text-slate-600">{consultation.teacherName ?? "담당 선생님 미지정"}</span>
                  <ConsultationStatusBadge status={consultation.status} />
                </Link>
              ))}
            </div>
          )}
        </AcademyCard>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AcademyCard>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">미처리 알림</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  학생, 선생님, 시간표 중심으로 확인해야 할 항목입니다.
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
                    className="block rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <span className="font-bold text-slate-900">{notification.title}</span>
                    <span className="mt-1 block">{notification.message}</span>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-sm text-slate-700">
                  확인할 미처리 알림이 없습니다.
                </div>
              )}
            </div>
          </AcademyCard>

          <AcademyCard>
            <h2 className="text-xl font-bold text-slate-950">빠른 작업</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              학생과 선생님 운영에 필요한 작업으로 바로 이동합니다.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {registrationActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {managementMenus.map((menu) => (
              <Link
                key={menu.href}
                href={menu.href}
                className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60 transition hover:-translate-y-1 hover:border-blue-100 hover:shadow-2xl hover:shadow-blue-100/60"
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

function ConsultationStatusBadge({ status }: { status: ConsultationStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${consultationStatusStyles[status]}`}>
      {consultationStatusLabels[status]}
    </span>
  );
}

function filterTodayConsultations(requests: ConsultationRequestResponse[]) {
  return requests
    .filter((request) => request.status === "REQUESTED" || request.status === "APPROVED")
    .sort((a, b) => normalizeTime(a.requestedStartTime).localeCompare(normalizeTime(b.requestedStartTime)));
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTime(time: string) {
  return time.slice(0, 5);
}
