"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ApiError,
  createTeacherInvitation,
  getAcademyStudent,
  getAcademyStudents,
  getAcademyTeacherInvitations,
  getAcademyTeachers,
  getMyAcademy,
  updateMyAcademy,
} from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import type {
  AcademyStudentResponse,
  AcademyTeacherResponse,
  AcademyUpdateRequest,
  TeacherInvitationCreateRequest,
  TeacherInvitationResponse,
  TeacherInvitationStatus,
} from "@/types/auth";
import {
  AcademyCard,
  AcademyLinkButton,
  AcademyShell,
  EmptyState,
  FieldPreview,
  StatusBadge,
  TabPreview,
} from "./AcademyShell";
import { AcademyStudentRegistrationModal } from "./AcademyStudentRegistrationModal";

export function AcademyStudentsPage() {
  const { accessToken } = useAuth();
  const [students, setStudents] = useState<AcademyStudentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  const loadStudents = useCallback(() => {
    if (!accessToken) return;

    setIsLoading(true);
    getAcademyStudents(accessToken)
      .then((data) => {
        setStudents(data);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;

    let isMounted = true;
    getAcademyStudents(accessToken)
      .then((data) => {
        if (isMounted) {
          setStudents(data);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (isMounted) setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  return (
    <AcademyShell
      title="학생 관리"
      description="학생과 보호자 정보를 관리하세요."
      actions={<StudentRegistrationButton onClick={() => setIsRegistrationOpen(true)} />}
    >
      <div className="space-y-6">
        {errorMessage ? (
          <p className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        ) : null}

        <AcademyCard>
          <div className="grid gap-3 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr]">
            <FieldPreview label="검색" value="준비 중" />
            <FieldPreview label="학년" value="전체" />
            <FieldPreview label="상태" value="전체" />
            <FieldPreview label="미납 여부" value="전체" />
          </div>
        </AcademyCard>

        {isLoading ? (
          <p className="text-sm font-semibold text-slate-600">학생 목록을 불러오고 있습니다.</p>
        ) : null}

        {!isLoading && students.length === 0 ? (
          <EmptyState
            title="아직 등록된 학생이 없습니다."
            description="학생 정보를 등록해 관리를 시작해 보세요."
            action={<StudentRegistrationButton onClick={() => setIsRegistrationOpen(true)} />}
          />
        ) : null}

        {!isLoading && students.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="grid bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 md:grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr]">
              <span>이름</span>
              <span>학교/학년</span>
              <span>학생 연락처</span>
              <span>보호자 연락처</span>
              <span>상태</span>
            </div>
            {students.map((student) => (
              <Link
                key={student.id}
                href={`/academy/students/${student.id}`}
                className="grid gap-2 border-t border-slate-200 px-4 py-4 text-sm text-slate-700 transition hover:bg-slate-50 md:grid-cols-[1.2fr_1fr_1fr_1fr_0.8fr]"
              >
                <span className="font-semibold text-slate-950">{student.name}</span>
                <span>
                  {student.school || "-"} / {student.grade || "-"}
                </span>
                <span>{student.phone || "연락처 없음"}</span>
                <span>{student.guardianPhone || "연락처 없음"}</span>
                <StatusBadge>{getStudentStatusLabel(student.status)}</StatusBadge>
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {isRegistrationOpen ? (
        <AcademyStudentRegistrationModal
          accessToken={accessToken}
          onClose={() => setIsRegistrationOpen(false)}
          onCompleted={loadStudents}
        />
      ) : null}
    </AcademyShell>
  );
}


export function AcademyStudentNewPage() {
  return (
    <AcademyShell title="학생 등록" description="학생 관리는 학생 목록 화면에서 바로 등록할 수 있습니다.">
      <AcademyCard>
        <p className="text-sm font-semibold text-slate-700">
          학생 목록 화면에서 학생 등록 버튼을 눌러 등록을 진행해 주세요.
        </p>
        <div className="mt-5">
          <AcademyLinkButton href="/academy/students">학생 관리로 이동</AcademyLinkButton>
        </div>
      </AcademyCard>
    </AcademyShell>
  );
}

function StudentRegistrationButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
    >
      학생 등록
    </button>
  );
}

export function AcademyStudentDetailPage({ studentId }: { studentId: string }) {
  const { accessToken } = useAuth();
  const [student, setStudent] = useState<AcademyStudentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void Promise.resolve().then(() => {
      if (!accessToken || !isMounted) return;

      setIsLoading(true);
      setErrorMessage("");
      getAcademyStudent(parseInt(studentId), accessToken)
        .then((data) => {
          if (isMounted) setStudent(data);
        })
        .catch((error) => {
          if (isMounted) setErrorMessage(getErrorMessage(error));
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    });

    return () => {
      isMounted = false;
    };
  }, [accessToken, studentId]);


  return (
    <AcademyShell title="학생 상세" description={student ? `${student.name} 학생의 정보를 관리합니다.` : "학생 정보를 확인합니다."}>
      <div className="space-y-6">
        <TabPreview tabs={["기본 정보", "보호자 연락처", "수강 정보 준비 중", "출석 기록 준비 중", "청구서/수강료 준비 중", "재원생 상담 준비 중"]} />

        {errorMessage ? (
          <p className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm font-semibold text-slate-600">학생 정보를 불러오고 있습니다.</p>
        ) : null}

        {student ? (
          <AcademyCard>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <StatusBadge>{getStudentStatusLabel(student.status)}</StatusBadge>
                <h2 className="mt-3 text-xl font-bold text-slate-950">{student.name}</h2>
              </div>
              {/* Connection Status */
              student.userId ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 border border-emerald-100">
                  계정 연결됨
                </span>
              ) : student.matchedStudentUserExists ? (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 border border-amber-100">
                  계정 매칭됨 (초대 필요)
                </span>
              ) : (
                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500 border border-slate-100">
                  비회원
                </span>
              )
            }
            </div>

            <StudentDetailBasicTab student={student} />
          </AcademyCard>
        ) : null}
      </div>
    </AcademyShell>
  );
}

function StudentDetailBasicTab({ student }: { student: AcademyStudentResponse }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FieldPreview label="학교" value={student.school || "-"} />
      <FieldPreview label="학년" value={student.grade || "-"} />
      <FieldPreview label="이메일" value={student.email || "-"} />
      <FieldPreview label="학생 연락처" value={student.phone || "-"} />
      <StudentGuardianInfoCard student={student} />
      <div className="sm:col-span-2">
        <FieldPreview label="메모" value={student.memo || "-"} />
      </div>
    </div>
  );
}

function StudentGuardianInfoCard({ student }: { student: AcademyStudentResponse }) {
  return (
    <>
      <FieldPreview label="보호자 연락처" value={student.guardianParentPhone || student.guardianPhone || "-"} />
      <FieldPreview label="보호자 계정" value={student.guardianAccountLinked ? "계정 연결됨" : "미연결"} />
    </>
  );
}

export function AcademyTeachersPage() {
  const { accessToken } = useAuth();
  const [teachers, setTeachers] = useState<AcademyTeacherResponse[]>([]);
  const [invitations, setInvitations] = useState<TeacherInvitationResponse[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    void Promise.all([
      getAcademyTeachers(accessToken),
      getAcademyTeacherInvitations(accessToken),
    ])
      .then(([teacherResponses, invitationResponses]) => {
        if (isMounted) {
          setTeachers(teacherResponses);
          setInvitations(invitationResponses);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getTeacherInvitationErrorMessage(error));
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

  return (
    <AcademyShell
      title="선생님 관리"
      description="학원에 소속된 선생님과 보낸 초대장을 관리합니다."
      actions={<AcademyLinkButton href="/academy/teachers/new">선생님 초대</AcademyLinkButton>}
    >
      <div className="space-y-6">
        {errorMessage ? (
          <p className="whitespace-pre-line rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        ) : null}

        <AcademyCard>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">소속 선생님</h2>
              <p className="mt-1 text-sm text-slate-600">초대장을 수락한 선생님이 표시됩니다.</p>
            </div>
            <StatusBadge>{teachers.length}명</StatusBadge>
          </div>
          {isLoading ? (
            <p className="mt-5 text-sm font-semibold text-slate-600">선생님 목록을 불러오고 있습니다.</p>
          ) : null}

          {!isLoading && teachers.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="아직 연결된 선생님이 없습니다."
                description="선생님에게 초대장을 보내 학원에 연결해 보세요."
                action={<AcademyLinkButton href="/academy/teachers/new">선생님 초대</AcademyLinkButton>}
              />
            </div>
          ) : null}

          {teachers.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
              <div className="grid bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 md:grid-cols-[1fr_1.4fr_1fr_1fr_0.8fr]">
                <span>이름</span>
                <span>이메일</span>
                <span>전화번호</span>
                <span>연결일</span>
                <span>상태</span>
              </div>
              {teachers.map((teacher) => (
                <div
                  key={teacher.teacherUserId}
                  className="grid gap-2 border-t border-slate-200 px-4 py-4 text-sm text-slate-700 md:grid-cols-[1fr_1.4fr_1fr_1fr_0.8fr]"
                >
                  <span className="font-semibold text-slate-950">{teacher.name}</span>
                  <span>{teacher.email}</span>
                  <span>{teacher.phone ?? "-"}</span>
                  <span>{formatDate(teacher.connectedAt)}</span>
                  <span>{teacher.memberStatus === "ACTIVE" ? "활성" : "비활성"}</span>
                </div>
              ))}
            </div>
          ) : null}
        </AcademyCard>

        <AcademyCard>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">보낸 초대장</h2>
              <p className="mt-1 text-sm text-slate-600">초대 상태는 선생님 응답 후 갱신됩니다.</p>
            </div>
            <StatusBadge>{invitations.length}건</StatusBadge>
          </div>

          {invitations.length === 0 ? (
            <div className="mt-5">
              <EmptyState
                title="보낸 초대장이 없습니다."
                description="이메일과 전화번호를 입력해 초대장을 보내세요."
                action={<AcademyLinkButton href="/academy/teachers/new">선생님 초대</AcademyLinkButton>}
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {invitations.map((invitation) => (
                <div key={invitation.invitationId} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-950">{invitation.teacherEmail}</h3>
                      <p className="mt-1 text-sm text-slate-600">{invitation.teacherPhone}</p>
                      <p className="mt-3 text-xs font-semibold text-slate-500">보낸 날짜 {formatDate(invitation.createdAt)}</p>
                    </div>
                    <StatusBadge>{getInvitationStatusLabel(invitation.status)}</StatusBadge>
                  </div>
                  {invitation.message ? (
                    <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">{invitation.message}</p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </AcademyCard>
      </div>
    </AcademyShell>
  );
}

export function AcademyTeacherNewPage() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<TeacherInvitationCreateRequest>({
    teacherEmail: "",
    teacherPhone: "",
    message: fallbackInvitationMessage(),
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    void getMyAcademy(accessToken)
      .then((academy) => {
        if (isMounted) {
          setForm((current) => ({
            ...current,
            message: defaultInvitationMessage(academy.name),
          }));
        }
      })
      .catch(() => {
        if (isMounted) {
          setForm((current) => ({
            ...current,
            message: fallbackInvitationMessage(),
          }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setErrorMessage("초대장을 보내지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.");
      return;
    }

    setIsSending(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await createTeacherInvitation(form, accessToken);
      setForm((current) => ({
        teacherEmail: "",
        teacherPhone: "",
        message: current.message,
      }));
      setSuccessMessage("선생님 초대장을 보냈습니다.");
    } catch (error) {
      setErrorMessage(getTeacherInvitationErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AcademyShell title="선생님 초대" description="선생님에게 초대장을 보내 학원에 연결하세요.">
      <AcademyCard>
        {successMessage ? (
          <p className="mb-5 rounded-md border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mb-5 whitespace-pre-line rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        ) : null}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <AcademyTextField
              label="이메일"
              value={form.teacherEmail}
              onChange={(value) => setForm((current) => ({ ...current, teacherEmail: value }))}
              required
            />
            <AcademyTextField
              label="전화번호"
              value={form.teacherPhone}
              onChange={(value) => setForm((current) => ({ ...current, teacherPhone: value }))}
              required
            />
          </div>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">초대 메시지</span>
            <textarea
              value={form.message}
              onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
              className="mt-2 min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSending ? "전송 중" : "초대장 보내기"}
            </button>
          </div>
        </form>
      </AcademyCard>
    </AcademyShell>
  );
}

export function AcademySchedulePage() {
  return (
    <AcademyShell
      title="시간표 관리"
      description="요일별 수업과 담당 선생님을 확인하고 수업 상세로 이동합니다."
      actions={<AcademyLinkButton href="/academy/schedule/new">시간표 생성</AcademyLinkButton>}
    >
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 md:grid-cols-3">
            <FieldPreview label="요일" value="전체" />
            <FieldPreview label="선생님" value="전체" />
            <FieldPreview label="상태" value="운영 중" />
          </div>
        </AcademyCard>
        <Link href="/academy/schedule/sample-class" className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <StatusBadge>예시</StatusBadge>
              <h2 className="mt-3 text-xl font-bold text-slate-950">중2 수학 A반</h2>
              <p className="mt-2 text-sm text-slate-600">월/수 18:00 - 20:00</p>
            </div>
            <div className="text-sm leading-6 text-slate-600">
              <p>담당 선생님 미지정</p>
              <p>수강 학생 0명</p>
            </div>
          </div>
        </Link>
      </div>
    </AcademyShell>
  );
}

export function AcademyScheduleNewPage() {
  return (
    <AcademyShell title="시간표 생성" description="수업명, 요일, 시간, 담당 선생님을 입력해 시간표를 만드는 화면입니다.">
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["수업명", "담당 선생님", "요일", "시작 시간", "종료 시간", "강의실", "수강 학생", "메모"].map((field) => (
              <FieldPreview key={field} label={field} value="준비 중" />
            ))}
          </div>
        </AcademyCard>
        <EmptyState
          title="시간표 생성 기능은 준비 중입니다."
          description="수업명, 요일, 시간, 담당 선생님을 입력해 시간표를 만들 수 있도록 준비하고 있습니다."
        />
      </div>
    </AcademyShell>
  );
}

export function AcademyScheduleDetailPage({ classId }: { classId: string }) {
  return (
    <AcademyShell title="수업/클래스 상세 관리" description={`시간표에서 선택한 수업 ${classId}의 상세 관리 화면입니다.`}>
      <div className="space-y-6">
        <TabPreview tabs={["기본 정보", "수강 학생", "시간표", "출석 기록", "숙제", "공지"]} />
        <AcademyCard>
          <h2 className="text-xl font-bold text-slate-950">클래스 관리는 이 화면에서 처리합니다.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            독립적인 클래스 관리 메뉴를 두지 않고 시간표에서 특정 수업을 선택해 상세 관리로 진입합니다.
          </p>
        </AcademyCard>
      </div>
    </AcademyShell>
  );
}

export function AcademyConsultationsPage() {
  return (
    <AcademyShell
      title="신규 상담"
      description="등록 전 문의와 신규 상담 예약 상태를 관리합니다."
      actions={<AcademyLinkButton href="/academy/consultations/new">신규 상담 등록</AcademyLinkButton>}
    >
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["학생 이름", "보호자 이름", "연락처", "희망 과목", "희망 상담일", "상태", "메모"].map((field) => (
              <FieldPreview key={field} label={field} value="목록 항목" />
            ))}
          </div>
        </AcademyCard>
        <EmptyState
          title="신규 상담 내역이 없습니다."
          description="등록 전 문의는 이 화면에서 관리하고, 재원생 상담은 학생 상세 화면에서 관리합니다."
          action={<AcademyLinkButton href="/academy/consultations/new">신규 상담 등록</AcademyLinkButton>}
        />
      </div>
    </AcademyShell>
  );
}

export function AcademyConsultationNewPage() {
  return (
    <AcademyShell title="신규 상담 등록" description="등록 전 문의와 상담 예약 정보를 입력하는 화면입니다.">
      <AcademyCard>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["학생 이름", "보호자 이름", "연락처", "희망 과목", "희망 상담일", "상태", "메모"].map((field) => (
            <FieldPreview key={field} label={field} value="준비 중" />
          ))}
        </div>
      </AcademyCard>
    </AcademyShell>
  );
}

export function AcademyInvoicesPage() {
  return (
    <AcademyShell title="청구서/수납" description="학생별 청구서와 수강료 납부 상태를 확인합니다.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["이번 달 청구서 0건", "미납 목록 0건", "납부 완료 0건", "청구서 미발송 0건"].map((item) => (
          <AcademyCard key={item}>
            <p className="text-lg font-bold text-slate-950">{item}</p>
            <p className="mt-2 text-sm text-slate-600">상태 관리는 도메인 API 연결 후 제공됩니다.</p>
          </AcademyCard>
        ))}
      </div>
    </AcademyShell>
  );
}

export function AcademyAttendancePage() {
  return (
    <AcademyShell title="출석 현황" description="학원 계정은 출석 처리 결과와 기록을 조회합니다.">
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 md:grid-cols-4">
            <FieldPreview label="기간" value="이번 달" />
            <FieldPreview label="클래스" value="전체" />
            <FieldPreview label="학생" value="전체" />
            <FieldPreview label="상태" value="지각/결석 포함" />
          </div>
        </AcademyCard>
        <EmptyState
          title="출석 기록이 없습니다."
          description="클래스별 출석 기록, 학생별 출석 기록, 지각/결석 목록을 조회할 수 있도록 준비하고 있습니다."
        />
      </div>
    </AcademyShell>
  );
}

export function AcademySettingsPage() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<AcademyUpdateRequest>({
    name: "",
    representativeName: "",
    phone: "",
    postalCode: "",
    address: "",
    detailAddress: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    void getMyAcademy(accessToken)
      .then((academy) => {
        if (isMounted) {
          setForm({
            name: academy.name,
            representativeName: academy.representativeName,
            phone: academy.phone,
            postalCode: academy.postalCode ?? "",
            address: academy.address ?? "",
            detailAddress: academy.detailAddress ?? "",
          });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getErrorMessage(error));
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setErrorMessage("학원 정보를 저장하지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.");
      return;
    }

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const academy = await updateMyAcademy(form, accessToken);
      setForm({
        name: academy.name,
        representativeName: academy.representativeName,
        phone: academy.phone,
        postalCode: academy.postalCode ?? "",
        address: academy.address ?? "",
        detailAddress: academy.detailAddress ?? "",
      });
      setSuccessMessage("학원 정보가 저장되었습니다.");
    } catch {
      setErrorMessage("학원 정보를 저장하지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AcademyShell title="학원 설정" description="학원 기본 정보와 계정 정보를 관리합니다.">
      <AcademyCard>
        {isLoading ? (
          <p className="text-sm font-semibold text-slate-600">학원 정보를 불러오고 있습니다.</p>
        ) : null}

        {successMessage ? (
          <p className="mb-5 rounded-md border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mb-5 whitespace-pre-line rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        ) : null}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <AcademyTextField
              label="학원명"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              required
            />
            <AcademyTextField
              label="대표자명"
              value={form.representativeName}
              onChange={(value) => setForm((current) => ({ ...current, representativeName: value }))}
              required
            />
            <AcademyTextField
              label="전화번호"
              value={form.phone}
              onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              required
            />
            <AcademyTextField
              label="우편번호"
              value={form.postalCode}
              onChange={(value) => setForm((current) => ({ ...current, postalCode: value }))}
            />
            <AcademyTextField
              label="기본 주소"
              value={form.address}
              onChange={(value) => setForm((current) => ({ ...current, address: value }))}
            />
            <AcademyTextField
              label="상세 주소"
              value={form.detailAddress}
              onChange={(value) => setForm((current) => ({ ...current, detailAddress: value }))}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? "저장 중" : "저장"}
            </button>
          </div>
        </form>
      </AcademyCard>
    </AcademyShell>
  );
}

function AcademyTextField({
  label,
  value,
  onChange,
  required = false,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        required={required}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.";
}

function getTeacherInvitationErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "초대장을 보내지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.";
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

function getStudentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "재원",
    INACTIVE: "비활성",
    GRADUATED: "졸업",
  };

  return labels[status] || status;
}

function defaultInvitationMessage(academyName: string) {
  return `${academyName}에서 선생님 초대장을 보냈습니다.\n초대를 수락하면 해당 학원의 선생님으로 연결됩니다.`;
}

function fallbackInvitationMessage() {
  return "Ringdu에서 선생님 초대장을 보냈습니다.\n초대를 수락하면 해당 학원의 선생님으로 연결됩니다.";
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
