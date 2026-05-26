"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  acceptTeacherInvitation,
  ApiError,
  getMyTeacherInvitations,
  rejectTeacherInvitation,
} from "@/lib/api";
import type { MyTeacherInvitationResponse, TeacherInvitationStatus } from "@/types/auth";

const teacherMenu = [
  { href: "/teacher", label: "선생님 홈" },
  { href: "/teacher/invitations", label: "초대장" },
];

const preparingMenus = ["내 수업", "출석 승인", "숙제 관리", "공지"];

export function TeacherDashboardPage() {
  const { accessToken } = useAuth();
  const [invitations, setInvitations] = useState<MyTeacherInvitationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    void getMyTeacherInvitations(accessToken)
      .then((responses) => {
        if (isMounted) {
          setInvitations(responses);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getTeacherErrorMessage(error));
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
  }, [accessToken]);

  const pendingInvitations = useMemo(
    () => invitations.filter((invitation) => invitation.status === "PENDING"),
    [invitations],
  );
  const connectedAcademies = useMemo(
    () => invitations.filter((invitation) => invitation.status === "ACCEPTED"),
    [invitations],
  );

  return (
    <TeacherShell title="선생님 홈">
      <div className="space-y-6">
        {errorMessage ? <AlertMessage tone="error">{errorMessage}</AlertMessage> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="받은 초대장" value={`${pendingInvitations.length}건`} />
          <SummaryCard label="연결된 학원" value={`${connectedAcademies.length}곳`} />
          <SummaryCard label="오늘 수업" value="준비 중" muted />
          <SummaryCard label="출석 승인" value="준비 중" muted />
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <TeacherCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">받은 초대장</h2>
                <p className="mt-1 text-sm text-slate-600">학원에서 보낸 대기 중 초대장을 확인합니다.</p>
              </div>
              <TeacherLinkButton href="/teacher/invitations">초대장 확인하기</TeacherLinkButton>
            </div>

            {isLoading ? (
              <p className="mt-5 text-sm font-semibold text-slate-600">초대장을 불러오고 있습니다.</p>
            ) : null}

            {!isLoading && pendingInvitations.length === 0 ? (
              <TeacherEmptyState
                title="대기 중인 초대장이 없습니다."
                description="새 초대장이 도착하면 이곳에서 바로 확인할 수 있습니다."
              />
            ) : null}

            {pendingInvitations.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {pendingInvitations.slice(0, 3).map((invitation) => (
                  <InvitationPreview key={invitation.invitationId} invitation={invitation} />
                ))}
              </div>
            ) : null}
          </TeacherCard>

          <TeacherCard>
            <h2 className="text-lg font-bold text-slate-950">연결된 학원</h2>
            <p className="mt-1 text-sm text-slate-600">초대장을 수락한 학원이 표시됩니다.</p>

            {!isLoading && connectedAcademies.length === 0 ? (
              <TeacherEmptyState
                title="아직 연결된 학원이 없습니다."
                description="학원 초대장을 수락하면 연결된 학원이 표시됩니다."
              />
            ) : null}

            {connectedAcademies.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {connectedAcademies.map((invitation) => (
                  <div key={invitation.invitationId} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-slate-950">{invitation.academyName}</h3>
                        <p className="mt-1 text-sm text-slate-600">연결됨</p>
                      </div>
                      <StatusBadge status={invitation.status} />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </TeacherCard>
        </section>

        <TeacherCard>
          <h2 className="text-lg font-bold text-slate-950">준비 중 메뉴</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {preparingMenus.map((menu) => (
              <div key={menu} className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
                <p className="font-bold text-slate-950">{menu}</p>
                <p className="mt-2 text-sm font-semibold text-slate-500">준비 중</p>
              </div>
            ))}
          </div>
        </TeacherCard>
      </div>
    </TeacherShell>
  );
}

export function TeacherInvitationsPage() {
  const { accessToken } = useAuth();
  const [invitations, setInvitations] = useState<MyTeacherInvitationResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadInvitations = async () => {
    if (!accessToken) {
      return;
    }

    try {
      setInvitations(await getMyTeacherInvitations(accessToken));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getTeacherErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;

    void getMyTeacherInvitations(accessToken)
      .then((responses) => {
        if (isMounted) {
          setInvitations(responses);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getTeacherErrorMessage(error));
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
  }, [accessToken]);

  const handleInvitation = async (invitationId: number, action: "accept" | "reject") => {
    if (!accessToken) {
      return;
    }

    setProcessingId(invitationId);
    setErrorMessage("");

    try {
      if (action === "accept") {
        await acceptTeacherInvitation(invitationId, accessToken);
      } else {
        await rejectTeacherInvitation(invitationId, accessToken);
      }
      await loadInvitations();
    } catch (error) {
      setErrorMessage(getTeacherErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <TeacherShell title="받은 초대장">
      <TeacherCard>
        {errorMessage ? <AlertMessage tone="error">{errorMessage}</AlertMessage> : null}

        {isLoading ? (
          <p className="text-sm font-semibold text-slate-600">초대장을 불러오고 있습니다.</p>
        ) : null}

        {!isLoading && invitations.length === 0 ? (
          <TeacherEmptyState
            title="아직 받은 학원 초대장이 없습니다."
            description="학원에서 보낸 초대장이 있으면 이곳에 표시됩니다."
          />
        ) : null}

        {invitations.length > 0 ? (
          <div className="grid gap-4">
            {invitations.map((invitation) => (
              <div key={invitation.invitationId} className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-950">{invitation.academyName}</h2>
                      <StatusBadge status={invitation.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">{invitation.teacherEmail}</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                      {invitation.message || "초대 메시지가 없습니다."}
                    </p>
                    <p className="mt-4 text-xs font-semibold text-slate-500">
                      받은 날짜 {formatDate(invitation.createdAt)}
                    </p>
                  </div>

                  {invitation.status === "PENDING" ? (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        disabled={processingId === invitation.invitationId}
                        onClick={() => void handleInvitation(invitation.invitationId, "accept")}
                        className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        수락
                      </button>
                      <button
                        type="button"
                        disabled={processingId === invitation.invitationId}
                        onClick={() => void handleInvitation(invitation.invitationId, "reject")}
                        className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
                      >
                        거절
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </TeacherCard>
    </TeacherShell>
  );
}

function TeacherShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <RoleGuard allowedRole="TEACHER">
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
          <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:block">
            <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
              Ringdu
            </Link>
            <p className="mt-2 text-sm font-medium text-slate-500">선생님</p>
            <nav className="mt-8 space-y-1">
              {teacherMenu.map((item) => (
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
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href="/" className="text-xl font-bold tracking-tight text-blue-700 lg:hidden">
                    Ringdu
                  </Link>
                  <p className="mt-2 text-xs font-semibold uppercase text-blue-600 lg:mt-0">TEACHER</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-950">{title}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">{user?.name ?? "선생님"}님</span>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    로그아웃
                  </button>
                </div>
              </div>
              <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
                {teacherMenu.map((item) => (
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

            <div className="flex-1 px-5 py-6 lg:px-8 lg:py-8">{children}</div>
          </section>
        </div>
      </main>
    </RoleGuard>
  );
}

function SummaryCard({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <TeacherCard>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-3 text-2xl font-bold ${muted ? "text-slate-500" : "text-slate-950"}`}>{value}</p>
    </TeacherCard>
  );
}

function TeacherCard({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">{children}</section>;
}

function TeacherLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
    >
      {children}
    </Link>
  );
}

function TeacherEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function InvitationPreview({ invitation }: { invitation: MyTeacherInvitationResponse }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-950">{invitation.academyName}</h3>
          <p className="mt-1 text-sm text-slate-600">받은 날짜 {formatDate(invitation.createdAt)}</p>
        </div>
        <StatusBadge status={invitation.status} />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TeacherInvitationStatus }) {
  const styles: Record<TeacherInvitationStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    ACCEPTED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-slate-100 text-slate-600",
    EXPIRED: "bg-red-50 text-red-700",
    CANCELED: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {getInvitationStatusLabel(status)}
    </span>
  );
}

function AlertMessage({ children, tone }: { children: ReactNode; tone: "error" }) {
  const className =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-600"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return <p className={`mb-5 whitespace-pre-line rounded-md border px-4 py-3 text-sm font-semibold ${className}`}>{children}</p>;
}

function getInvitationStatusLabel(status: TeacherInvitationStatus) {
  const labels: Record<TeacherInvitationStatus, string> = {
    PENDING: "대기",
    ACCEPTED: "수락",
    REJECTED: "거절",
    EXPIRED: "만료",
    CANCELED: "취소",
  };

  return labels[status];
}

function getTeacherErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "초대장 정보를 불러오지 못했습니다.\n잠시 후 다시 시도해 주세요.";
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
