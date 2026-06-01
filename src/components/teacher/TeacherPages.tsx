"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  acceptTeacherInvitation,
  ApiError,
  createTeacherAttendanceSession,
  getMyTeacherInvitations,
  getTeacherTodayClasses,
  rejectTeacherInvitation,
  saveTeacherAttendanceRecords,
} from "@/lib/api";
import {
  attendanceSessionStatusLabels,
  attendanceStatusLabels,
  attendanceStatusStyles,
  type AttendanceRecordResponse,
  type AttendanceSessionDetailResponse,
  type AttendanceStatus,
  type TeacherTodayClassResponse,
} from "@/types/attendance";
import type { MyTeacherInvitationResponse, TeacherInvitationStatus } from "@/types/auth";

const teacherMenu = [
  { href: "/teacher", label: "선생님 홈" },
  { href: "/teacher/attendance", label: "출석 체크" },
  { href: "/teacher/invitations", label: "초대장" },
];

const preparingMenus = ["내 수업", "출석 체크", "숙제 관리", "공지"];

export function TeacherDashboardPage() {
  const { accessToken } = useAuth();
  const [invitations, setInvitations] = useState<MyTeacherInvitationResponse[]>([]);
  const [todayClasses, setTodayClasses] = useState<TeacherTodayClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    void Promise.all([getMyTeacherInvitations(accessToken), getTeacherTodayClasses(accessToken)])
      .then(([responses, classes]) => {
        if (isMounted) {
          setInvitations(responses);
          setTodayClasses(classes);
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
  const completedAttendanceCount = todayClasses.filter((item) => item.attendanceStatus === "COMPLETED").length;
  const pendingAttendanceCount = todayClasses.length - completedAttendanceCount;

  return (
    <TeacherShell title="선생님 홈">
      <div className="space-y-6">
        {errorMessage ? <AlertMessage tone="error">{errorMessage}</AlertMessage> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="받은 초대장" value={`${pendingInvitations.length}건`} />
          <SummaryCard label="연결된 학원" value={`${connectedAcademies.length}곳`} />
          <SummaryCard label="오늘 수업" value={isLoading ? "-" : `${todayClasses.length}개`} />
          <SummaryCard label="출석 체크" value={isLoading ? "-" : `${pendingAttendanceCount}건`} muted={pendingAttendanceCount === 0} />
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
                  <div key={invitation.invitationId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
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
              <div key={menu} className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-5">
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
              <div key={invitation.invitationId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-950">{invitation.academyName}</h2>
                      <StatusBadge status={invitation.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-600">초대 전화번호 {invitation.teacherPhone}</p>
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
                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                      >
                        수락
                      </button>
                      <button
                        type="button"
                        disabled={processingId === invitation.invitationId}
                        onClick={() => void handleInvitation(invitation.invitationId, "reject")}
                        className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:text-slate-400"
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

export function TeacherAttendancePage() {
  const { accessToken } = useAuth();
  const [todayClasses, setTodayClasses] = useState<TeacherTodayClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadTodayClasses = useCallback(() => {
    if (!accessToken) return;

    setIsLoading(true);
    setErrorMessage("");
    void getTeacherTodayClasses(accessToken)
      .then((classes) => {
        setTodayClasses(classes);
      })
      .catch((error) => {
        setErrorMessage(getTeacherErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken]);

  useEffect(() => {
    void Promise.resolve().then(loadTodayClasses);
  }, [loadTodayClasses]);

  const completedClasses = todayClasses.filter((item) => item.attendanceStatus === "COMPLETED");
  const pendingClasses = todayClasses.filter((item) => item.attendanceStatus !== "COMPLETED");

  return (
    <TeacherShell title="출석 체크">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="오늘 수업" value={isLoading ? "-" : `${todayClasses.length}개`} />
          <SummaryCard label="출석 처리 대기" value={isLoading ? "-" : `${pendingClasses.length}건`} muted={pendingClasses.length === 0} />
          <SummaryCard label="처리 완료" value={isLoading ? "-" : `${completedClasses.length}건`} muted={completedClasses.length === 0} />
        </div>

        {errorMessage ? <AlertMessage tone="error">{errorMessage}</AlertMessage> : null}

        <TeacherCard>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">오늘 수업</h2>
              <p className="mt-1 text-sm text-slate-600">담당 수업의 출석을 체크합니다.</p>
            </div>
            <button
              type="button"
              onClick={loadTodayClasses}
              className="inline-flex h-10 w-fit items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
            >
              새로고침
            </button>
          </div>

          {isLoading ? <p className="mt-5 text-sm font-semibold text-slate-600">오늘 수업을 불러오고 있습니다.</p> : null}

          {!isLoading && todayClasses.length === 0 ? (
            <TeacherEmptyState
              title="오늘 담당 수업이 없습니다."
              description="담당 수업이 배정되면 이곳에서 출석을 체크할 수 있습니다."
            />
          ) : null}

          {todayClasses.length > 0 ? (
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {todayClasses.map((attendanceClass) => (
              <Link
                key={attendanceClass.classId}
                href={`/teacher/attendance/${attendanceClass.classId}`}
                className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-blue-200 hover:bg-blue-50"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-950">{attendanceClass.className}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {attendanceClass.dayLabel} {formatTime(attendanceClass.startTime)} - {formatTime(attendanceClass.endTime)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {attendanceClass.classroomName} · 수강 학생 {attendanceClass.studentCount}명
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <AttendanceSessionStatusBadge status={attendanceClass.attendanceStatus} />
                    <span className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white">
                      출석 체크
                    </span>
                  </div>
                </div>
              </Link>
              ))}
            </div>
          ) : null}
        </TeacherCard>

        <section className="grid gap-6 xl:grid-cols-2">
          <TeacherCard>
            <h2 className="text-lg font-bold text-slate-950">출석 처리 대기</h2>
            <div className="mt-4 grid gap-3">
              {pendingClasses.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  처리 대기 중인 수업이 없습니다.
                </p>
              ) : null}
              {pendingClasses.map((attendanceClass) => (
                <Link key={attendanceClass.classId} href={`/teacher/attendance/${attendanceClass.classId}`} className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 transition hover:bg-amber-100">
                  <p className="font-bold text-slate-950">{attendanceClass.className}</p>
                  <p className="mt-1 text-sm font-semibold text-amber-700">오늘 출석 체크 필요</p>
                </Link>
              ))}
            </div>
          </TeacherCard>

          <TeacherCard>
            <h2 className="text-lg font-bold text-slate-950">처리 완료</h2>
            <div className="mt-4 grid gap-3">
              {completedClasses.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
                  아직 처리 완료된 출석이 없습니다.
                </p>
              ) : null}
              {completedClasses.map((attendanceClass) => (
                <div key={attendanceClass.classId} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                  <p className="font-bold text-slate-950">{attendanceClass.className}</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-700">출석 처리 완료</p>
                </div>
              ))}
            </div>
          </TeacherCard>
        </section>
      </div>
    </TeacherShell>
  );
}

export function TeacherAttendanceDetailPage({ classId }: { classId: string }) {
  const { accessToken } = useAuth();
  const numericClassId = Number(classId);
  const [attendanceDate, setAttendanceDate] = useState(getTodayDateInput());
  const [session, setSession] = useState<AttendanceSessionDetailResponse | null>(null);
  const [attendanceState, setAttendanceState] = useState<Record<number, { status: AttendanceStatus; memo: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const loadAttendanceSession = useCallback(() => {
    if (!accessToken || !Number.isFinite(numericClassId)) return;

    setIsLoading(true);
    setErrorMessage("");
    setSavedMessage("");
    void createTeacherAttendanceSession(numericClassId, attendanceDate, accessToken)
      .then((data) => {
        setSession(data);
        setAttendanceState(toAttendanceState(data.records));
      })
      .catch((error) => {
        setErrorMessage(getTeacherErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, attendanceDate, numericClassId]);

  useEffect(() => {
    void Promise.resolve().then(loadAttendanceSession);
  }, [loadAttendanceSession]);

  const updateStudentAttendance = (studentProfileId: number, status: AttendanceStatus, memo?: string) => {
    setAttendanceState((current) => ({
      ...current,
      [studentProfileId]: {
        status,
        memo: memo ?? current[studentProfileId]?.memo ?? "",
      },
    }));
    setSavedMessage("");
  };

  const handleSave = async () => {
    if (!accessToken || !session) return;

    setIsSaving(true);
    setErrorMessage("");
    try {
      const updated = await saveTeacherAttendanceRecords(
        session.attendanceSessionId,
        {
          records: session.records.map((record) => ({
            studentProfileId: record.studentProfileId,
            status: attendanceState[record.studentProfileId]?.status ?? record.status,
            memo: attendanceState[record.studentProfileId]?.memo ?? record.memo ?? "",
          })),
        },
        accessToken,
      );
      setSession(updated);
      setAttendanceState(toAttendanceState(updated.records));
      setSavedMessage("출석이 저장되었습니다.");
    } catch (error) {
      setErrorMessage(getTeacherErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TeacherShell title="출석 체크">
      <div className="space-y-6">
        <TeacherCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-blue-600">ATTENDANCE</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">{session?.className ?? "출석 체크"}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">출석/지각/결석을 선택하고 저장합니다.</p>
            </div>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">날짜 선택</span>
              <input
                type="date"
                value={attendanceDate}
                onChange={(event) => setAttendanceDate(event.target.value)}
                className="mt-2 h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </label>
          </div>
        </TeacherCard>

        {errorMessage ? <AlertMessage tone="error">{errorMessage}</AlertMessage> : null}

        {savedMessage ? (
          <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {savedMessage}
          </p>
        ) : null}

        <TeacherCard>
          <h2 className="text-lg font-bold text-slate-950">수강 학생 목록</h2>
          {isLoading ? <p className="mt-4 text-sm font-semibold text-slate-600">출석부를 불러오고 있습니다.</p> : null}
          {!isLoading && session?.records.length === 0 ? (
            <TeacherEmptyState
              title="수강 학생이 없습니다."
              description="수업에 학생이 추가되면 출석 체크 목록에 표시됩니다."
            />
          ) : null}
          {session ? (
            <div className="mt-4 grid gap-3">
            {session.records.map((student) => {
              const current = attendanceState[student.studentProfileId] ?? { status: student.status, memo: student.memo ?? "" };
              return (
                <div key={student.studentProfileId} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-start">
                    <div>
                      <p className="font-bold text-slate-950">{student.studentName}</p>
                      <p className="mt-2">
                        <AttendanceStatusBadge status={current.status} />
                      </p>
                    </div>
                    <div className="grid gap-3">
                      <div className="grid grid-cols-3 gap-2">
                        {(Object.keys(attendanceStatusLabels) as AttendanceStatus[]).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() => updateStudentAttendance(student.studentProfileId, status)}
                            className={`h-10 rounded-2xl border px-3 text-sm font-bold transition ${
                              current.status === status
                                ? "border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-100"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                            }`}
                          >
                            {attendanceStatusLabels[status]}
                          </button>
                        ))}
                      </div>
                      <input
                        value={current.memo}
                        onChange={(event) => updateStudentAttendance(student.studentProfileId, current.status, event.target.value)}
                        placeholder="메모 optional"
                        className="h-11 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          ) : null}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!session || isSaving}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
            >
              {isSaving ? "저장 중" : "저장하기"}
            </button>
          </div>
        </TeacherCard>
      </div>
    </TeacherShell>
  );
}

function TeacherShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <RoleGuard allowedRole="TEACHER">
      <main className="min-h-screen text-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
          <aside className="hidden w-60 shrink-0 border-r border-white/70 bg-white/80 px-5 py-6 backdrop-blur lg:block">
            <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
              Ringdu
            </Link>
            <p className="mt-2 text-sm font-medium text-slate-500">선생님</p>
            <nav className="mt-8 space-y-1">
              {teacherMenu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-2xl px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b border-white/70 bg-white/85 px-5 py-4 backdrop-blur">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <Link href="/" className="text-xl font-black tracking-tight text-blue-700 lg:hidden">
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
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
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
                    className="shrink-0 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
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
  return <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">{children}</section>;
}

function TeacherLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800"
    >
      {children}
    </Link>
  );
}

function TeacherEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function InvitationPreview({ invitation }: { invitation: MyTeacherInvitationResponse }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-blue-100 hover:bg-white">
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
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ring-black/5 ${styles[status]}`}>
      {getInvitationStatusLabel(status)}
    </span>
  );
}

function AttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${attendanceStatusStyles[status]}`}>
      {attendanceStatusLabels[status]}
    </span>
  );
}

function AttendanceSessionStatusBadge({ status }: { status: TeacherTodayClassResponse["attendanceStatus"] }) {
  const isCompleted = status === "COMPLETED";
  const label = status ? attendanceSessionStatusLabels[status] : "출석부 미생성";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${
        isCompleted
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : "bg-amber-50 text-amber-700 ring-amber-100"
      }`}
    >
      {label}
    </span>
  );
}

function toAttendanceState(records: AttendanceRecordResponse[]) {
  return Object.fromEntries(
    records.map((record) => [
      record.studentProfileId,
      {
        status: record.status,
        memo: record.memo ?? "",
      },
    ]),
  ) as Record<number, { status: AttendanceStatus; memo: string }>;
}

function getTodayDateInput() {
  const today = new Date();
  const timezoneOffset = today.getTimezoneOffset() * 60_000;
  return new Date(today.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function AlertMessage({ children, tone }: { children: ReactNode; tone: "error" }) {
  const className =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-600"
      : "border-slate-200 bg-slate-50 text-slate-600";

  return <p className={`mb-5 whitespace-pre-line rounded-2xl border px-4 py-3 text-sm font-semibold ${className}`}>{children}</p>;
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

  return "정보를 불러오지 못했습니다.\n잠시 후 다시 시도해 주세요.";
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
