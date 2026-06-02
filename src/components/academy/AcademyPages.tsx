"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  addAcademyClassStudent,
  ApiError,
  createTeacherInvitation,
  getAcademyStudentAttendanceRecords,
  getAcademyClasses,
  getAcademyStudent,
  getAcademyStudentClasses,
  getAcademyStudents,
  getAcademyTeacherInvitations,
  getAcademyTeachers,
  getMyAcademy,
  removeAcademyClassStudent,
  searchAccountCandidates,
  updateMyAcademy,
} from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import { ConsultationAvailabilitySettings } from "@/components/consultation/ConsultationAvailabilitySettings";
import { ConsultationRequestPanel, ConsultationStatusBadge } from "@/components/consultation/ConsultationRequestPanel";
import {
  attendanceStatusLabels,
  attendanceStatusStyles,
  attendanceMonthOptions,
  attendanceYearOptions,
  getCurrentAttendanceFilter,
  isSameAttendanceMonth,
  type AcademyStudentAttendanceRecordResponse,
  type AttendanceStatus,
} from "@/types/attendance";
import { mockConsultationRequests } from "@/types/consultation";
import type {
  AcademyStudentResponse,
  AcademyTeacherResponse,
  AcademyUpdateRequest,
  CandidateDto,
  TeacherInvitationCreateRequest,
  TeacherInvitationResponse,
  TeacherInvitationStatus,
} from "@/types/auth";
import type { AcademyClassResponse } from "@/types/schedule";
import {
  AcademyCard,
  AcademyLinkButton,
  AcademyShell,
  EmptyState,
  FieldPreview,
  StatusBadge,
} from "./AcademyShell";
import { AcademyStudentRegistrationModal } from "./AcademyStudentRegistrationModal";
export {
  AcademyScheduleDetailPage,
  AcademyScheduleNewPage,
  AcademySchedulePage,
} from "./schedule/AcademySchedulePage";

export function AcademyStudentsPage() {
  const { accessToken, user } = useAuth();
  const isPendingApproval = user?.status === "PENDING_APPROVAL";
  const [students, setStudents] = useState<AcademyStudentResponse[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<AcademyStudentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [detailErrorMessage, setDetailErrorMessage] = useState("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isConsultationPanelOpen, setIsConsultationPanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<StudentDetailTab>("기본 정보");

  const loadStudents = useCallback(() => {
    if (!accessToken || isPendingApproval) return;

    setIsLoading(true);
    getAcademyStudents(accessToken)
      .then((data) => {
        setStudents(data);
        if (data.length === 0) {
          setSelectedStudent(null);
        }
        setSelectedStudentId((current) => {
          if (current && data.some((student) => student.id === current)) {
            return current;
          }

          return data[0]?.id ?? null;
        });
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, isPendingApproval]);

  useEffect(() => {
    if (!accessToken || isPendingApproval) return;

    let isMounted = true;
    getAcademyStudents(accessToken)
      .then((data) => {
        if (isMounted) {
          setStudents(data);
          if (data.length === 0) {
            setSelectedStudent(null);
          }
          setSelectedStudentId((current) => {
            if (current && data.some((student) => student.id === current)) {
              return current;
            }

            return data[0]?.id ?? null;
          });
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
  }, [accessToken, isPendingApproval]);

  useEffect(() => {
    if (!accessToken || isPendingApproval || selectedStudentId === null) {
      return;
    }

    let isMounted = true;

    void Promise.resolve().then(() => {
      if (!isMounted) return;

      setIsDetailLoading(true);
      setDetailErrorMessage("");

      getAcademyStudent(selectedStudentId, accessToken)
        .then((data) => {
          if (isMounted) setSelectedStudent(data);
        })
        .catch((error) => {
          if (isMounted) {
            setSelectedStudent(null);
            setDetailErrorMessage(getErrorMessage(error));
          }
        })
        .finally(() => {
          if (isMounted) setIsDetailLoading(false);
        });
    });

    return () => {
      isMounted = false;
    };
  }, [accessToken, isPendingApproval, selectedStudentId]);

  return (
    <AcademyShell
      title="학생 관리"
      description="학생 목록을 보며 선택한 학생의 상세 정보를 함께 확인합니다."
      actions={<StudentRegistrationButton onClick={() => setIsRegistrationOpen(true)} />}
    >
      <div className="space-y-6">
        {errorMessage ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
            <button
              type="button"
              onClick={loadStudents}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              다시 시도
            </button>
          </div>
        ) : null}

        <AcademyCard>
          <div className="grid gap-3 md:grid-cols-[1.5fr_0.7fr]">
            <FieldPreview label="검색" value="준비 중" />
            <FieldPreview label="학년" value="전체" />
          </div>
        </AcademyCard>

        <AcademyCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-950">상담 요청</h2>
                <StatusBadge>mock</StatusBadge>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                신규 상담 요청과 재원생 상담 요청을 확인합니다.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsConsultationPanelOpen(true)}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              상담 요청 보기
            </button>
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
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.9fr)]">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <div className="hidden bg-slate-50 px-4 py-3 text-xs font-bold uppercase text-slate-500 lg:grid lg:grid-cols-[1fr_0.9fr_1fr_1fr]">
                <span>이름</span>
                <span>학교/학년</span>
                <span>학생 연락처</span>
                <span>보호자 연락처</span>
              </div>
              {students.map((student) => {
                const isSelected = selectedStudentId === student.id;

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      if (selectedStudentId !== student.id) {
                        setSelectedStudentId(student.id);
                        setSelectedStudent(null);
                      }
                      setActiveTab("기본 정보");
                    }}
                    className={`grid w-full gap-3 border-t px-4 py-4 text-left text-sm text-slate-700 transition sm:grid-cols-2 lg:grid-cols-[1fr_0.9fr_1fr_1fr] ${
                      isSelected
                        ? "border-blue-100 bg-blue-50/70 ring-1 ring-inset ring-blue-200"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <StudentListCell label="이름" value={student.name} strong />
                    <StudentListCell label="학교/학년" value={`${student.school || "-"} / ${student.grade || "-"}`} />
                    <StudentListCell label="학생 연락처" value={student.phone || "연락처 없음"} />
                    <StudentListCell
                      label="보호자 연락처"
                      value={student.guardianParentPhone || student.guardianPhone || "연락처 없음"}
                    />
                  </button>
                );
              })}
            </div>

            <StudentDetailPanel
              student={selectedStudent}
              isLoading={isDetailLoading}
              errorMessage={detailErrorMessage}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              accessToken={accessToken}
              emptyMessage="학생을 선택하면 상세 정보가 표시됩니다."
            />
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

      {isConsultationPanelOpen ? <ConsultationRequestPanel onClose={() => setIsConsultationPanelOpen(false)} /> : null}
    </AcademyShell>
  );
}

function StudentListCell({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <span className={strong ? "font-semibold text-slate-950" : ""}>
      <span className="mb-1 block text-xs font-bold text-slate-400 lg:hidden">{label}</span>
      {value}
    </span>
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
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800"
    >
      학생 등록
    </button>
  );
}

const studentDetailTabs = ["기본 정보", "수강 수업", "상담 메모", "청구/수납", "출석 기록"] as const;
type StudentDetailTab = (typeof studentDetailTabs)[number];

export function AcademyStudentDetailPage({ studentId }: { studentId: string }) {
  const { accessToken, user } = useAuth();
  const isPendingApproval = user?.status === "PENDING_APPROVAL";
  const [student, setStudent] = useState<AcademyStudentResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<StudentDetailTab>("기본 정보");

  useEffect(() => {
    let isMounted = true;
    const parsedStudentId = parseInt(studentId, 10);

    void Promise.resolve().then(() => {
      if (!accessToken || isPendingApproval || !isMounted) return;

      if (Number.isNaN(parsedStudentId)) {
        setErrorMessage("학생 정보를 찾을 수 없습니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");
      getAcademyStudent(parsedStudentId, accessToken)
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
  }, [accessToken, isPendingApproval, studentId]);


  return (
    <AcademyShell title="학생 상세" description={student ? `${student.name} 학생의 정보를 관리합니다.` : "학생 정보를 확인합니다."}>
      <StudentDetailPanel
        student={student}
        isLoading={isLoading}
        errorMessage={errorMessage}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        accessToken={accessToken}
        emptyMessage="학생 정보를 확인할 수 없습니다."
      />
    </AcademyShell>
  );
}

function StudentDetailPanel({
  student,
  isLoading,
  errorMessage,
  activeTab,
  onTabChange,
  accessToken,
  emptyMessage,
}: {
  student: AcademyStudentResponse | null;
  isLoading: boolean;
  errorMessage: string;
  activeTab: StudentDetailTab;
  onTabChange: (tab: StudentDetailTab) => void;
  accessToken: string | null;
  emptyMessage: string;
}) {
  return (
    <div className="space-y-4">
      {student || isLoading || errorMessage ? (
        <StudentDetailTabs activeTab={activeTab} onTabChange={onTabChange} />
      ) : null}

      {errorMessage ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? (
        <AcademyCard>
          <p className="text-sm font-semibold text-slate-600">학생 정보를 불러오고 있습니다.</p>
        </AcademyCard>
      ) : null}

      {!isLoading && !student && !errorMessage ? (
        <AcademyCard>
          <p className="text-sm font-semibold text-slate-600">{emptyMessage}</p>
        </AcademyCard>
      ) : null}

      {!isLoading && student ? (
        <AcademyCard>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-blue-600">학생 상세</p>
              <h2 className="mt-2 text-xl font-bold text-slate-950">{student.name}</h2>
            </div>
            <GuardianConnectionBadge student={student} />
          </div>

          <StudentDetailTabContent student={student} activeTab={activeTab} accessToken={accessToken} />
        </AcademyCard>
      ) : null}
    </div>
  );
}

function StudentDetailTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: StudentDetailTab;
  onTabChange: (tab: StudentDetailTab) => void;
}) {
  return (
    <div className="max-w-full overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 [scrollbar-width:thin]">
      <div className="flex w-max max-w-none gap-1.5 whitespace-nowrap pr-2">
        {studentDetailTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`h-9 shrink-0 rounded-2xl px-3 text-xs font-bold transition sm:h-10 sm:px-4 sm:text-sm ${
                isActive
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StudentDetailTabContent({
  student,
  activeTab,
  accessToken,
}: {
  student: AcademyStudentResponse;
  activeTab: StudentDetailTab;
  accessToken: string | null;
}) {
  if (activeTab === "기본 정보") {
    return <StudentDetailBasicTab student={student} />;
  }

  if (activeTab === "수강 수업") {
    return <StudentClassesTab student={student} accessToken={accessToken} />;
  }

  if (activeTab === "상담 메모") {
    return <StudentConsultationMemoTab student={student} />;
  }

  if (activeTab === "청구/수납") {
    return (
      <StudentDetailPlaceholder
        title="청구/수납"
        description="학생별 청구서와 수강료 납부 상태를 이곳에서 관리합니다."
      />
    );
  }

  return <StudentAttendanceRecordsTab student={student} accessToken={accessToken} />;
}

function StudentDetailBasicTab({ student }: { student: AcademyStudentResponse }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <FieldPreview label="학생 이름" value={student.name} />
      <FieldPreview label="학교" value={student.school || "-"} />
      <FieldPreview label="학년" value={student.grade || "-"} />
      <FieldPreview label="학생 연락처" value={student.phone || "-"} />
      <FieldPreview label="보호자 연락처" value={student.guardianParentPhone || student.guardianPhone || "-"} />
      <FieldPreview label="보호자 계정 연결 상태" value={student.guardianAccountLinked ? "계정 연결됨" : "미연결"} />
      <div className="sm:col-span-2">
        <FieldPreview label="메모" value={student.memo || "-"} />
      </div>
    </div>
  );
}

function StudentClassesTab({
  student,
  accessToken,
}: {
  student: AcademyStudentResponse;
  accessToken: string | null;
}) {
  const [classes, setClasses] = useState<AcademyClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removingClassId, setRemovingClassId] = useState<number | null>(null);

  const loadClasses = useCallback(() => {
    if (!accessToken) return;

    setIsLoading(true);
    setErrorMessage("");
    getAcademyStudentClasses(student.id, accessToken)
      .then((data) => {
        setClasses(data);
      })
      .catch((error) => {
        setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, student.id]);

  useEffect(() => {
    let isMounted = true;

    void Promise.resolve().then(() => {
      if (isMounted) loadClasses();
    });

    return () => {
      isMounted = false;
    };
  }, [loadClasses]);

  const handleRemoveClass = async (academyClass: AcademyClassResponse) => {
    if (!accessToken) return;
    const confirmed = window.confirm(`${academyClass.name} 수업에서 ${student.name} 학생을 제외할까요?`);
    if (!confirmed) return;

    setRemovingClassId(academyClass.classId);
    setErrorMessage("");
    try {
      await removeAcademyClassStudent(academyClass.classId, student.id, accessToken);
      loadClasses();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setRemovingClassId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">수강 수업</h3>
          <p className="mt-1 text-sm text-slate-600">학생 상세에서 바로 수강 수업을 추가하거나 제외합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800"
        >
          수업 추가
        </button>
      </div>

      {errorMessage ? (
        <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? <p className="text-sm font-semibold text-slate-600">수강 수업을 불러오고 있습니다.</p> : null}

      {!isLoading && classes.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6">
          <h3 className="text-lg font-bold text-slate-950">아직 수강 중인 수업이 없습니다.</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            수업을 추가해 학생의 시간표를 구성해 보세요.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            수업 추가
          </button>
        </div>
      ) : null}

      {classes.length > 0 ? (
        <div className="grid gap-3">
          {classes.map((academyClass) => (
            <div key={academyClass.classId} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h4 className="font-bold text-slate-950">{academyClass.name}</h4>
                  <p className="mt-2 text-sm font-semibold text-slate-600">
                    {academyClass.dayLabel} {academyClass.startTime} - {academyClass.endTime}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {academyClass.classroomName} · {academyClass.teacherName ?? "담당 선생님 미지정"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemoveClass(academyClass)}
                  disabled={removingClassId === academyClass.classId}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {removingClassId === academyClass.classId ? "제외 중" : "수업에서 제외"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {isModalOpen ? (
        <StudentClassPickerModal
          student={student}
          enrolledClasses={classes}
          accessToken={accessToken}
          onClose={() => setIsModalOpen(false)}
          onCompleted={() => {
            setIsModalOpen(false);
            loadClasses();
          }}
        />
      ) : null}
    </div>
  );
}

function StudentAttendanceRecordsTab({
  student,
  accessToken,
}: {
  student: AcademyStudentResponse;
  accessToken: string | null;
}) {
  const defaultFilter = getCurrentAttendanceFilter();
  const [records, setRecords] = useState<AcademyStudentAttendanceRecordResponse[]>([]);
  const [selectedYear, setSelectedYear] = useState(defaultFilter.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultFilter.month);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const filteredRecords = records.filter((record) => isSameAttendanceMonth(record.attendanceDate, selectedYear, selectedMonth));

  const loadRecords = useCallback(() => {
    if (!accessToken) return;

    setIsLoading(true);
    setErrorMessage("");
    // TODO: 백엔드 year/month query가 추가되면 여기서 ?year=&month= 파라미터로 연동한다.
    getAcademyStudentAttendanceRecords(student.id, accessToken)
      .then((data) => {
        setRecords(data);
      })
      .catch((error) => {
        setErrorMessage(getErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, student.id]);

  useEffect(() => {
    void Promise.resolve().then(loadRecords);
  }, [loadRecords]);

  const filterControls = (
    <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <label className="block">
          <span className="text-sm font-bold text-slate-700">년도</span>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(Number(event.target.value))}
            className="mt-2 h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            {attendanceYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">월</span>
          <select
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(Number(event.target.value))}
            className="mt-2 h-10 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            {attendanceMonthOptions.map((month) => (
              <option key={month} value={month}>
                {month}월
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={loadRecords}
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
        >
          조회
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {filterControls}
        <p className="text-sm font-semibold text-slate-600">출석 기록을 불러오고 있습니다.</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="space-y-3">
        {filterControls}
        <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
          <button
            type="button"
            onClick={loadRecords}
            className="mt-3 inline-flex h-10 items-center justify-center rounded-2xl bg-white px-4 text-sm font-bold text-red-600 ring-1 ring-red-100"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (filteredRecords.length === 0) {
    return (
      <div className="space-y-3">
        {filterControls}
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-5 py-8 text-center">
          <h3 className="text-base font-bold text-slate-950">선택한 기간의 출석 기록이 없습니다.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">수업 출석이 처리되면 이곳에 표시됩니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filterControls}
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">날짜</th>
              <th className="px-4 py-3">수업명</th>
              <th className="px-4 py-3">출석 상태</th>
              <th className="px-4 py-3">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRecords.map((record) => (
              <tr key={record.recordId}>
                <td className="px-4 py-4 font-semibold text-slate-700">{record.attendanceDate}</td>
                <td className="px-4 py-4 font-bold text-slate-950">{record.className}</td>
                <td className="px-4 py-4">
                  <StudentAttendanceStatusBadge status={record.status} />
                </td>
                <td className="px-4 py-4 text-slate-600">{record.memo || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:hidden">
        {filteredRecords.map((record) => (
          <div key={record.recordId} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{record.attendanceDate}</p>
                <h3 className="mt-1 font-bold text-slate-950">{record.className}</h3>
                <p className="mt-2 text-sm text-slate-600">{record.memo || "메모 없음"}</p>
              </div>
              <StudentAttendanceStatusBadge status={record.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StudentAttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${attendanceStatusStyles[status]}`}>
      {attendanceStatusLabels[status]}
    </span>
  );
}

function StudentConsultationMemoTab({ student }: { student: AcademyStudentResponse }) {
  const relatedRequests = mockConsultationRequests.filter((request) => request.studentName === student.name);
  const requested = relatedRequests.filter((request) => request.status === "REQUESTED");
  const scheduled = relatedRequests.filter((request) => request.status === "APPROVED");
  const completed = relatedRequests.filter((request) => request.status === "COMPLETED");

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">상담 관리</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            상담 요청이 승인되면 이곳에서 상담 이력을 관리할 수 있습니다.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-200 px-4 text-sm font-bold text-slate-500"
        >
          메모 추가 준비 중
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <ConsultationMemoColumn title="상담 요청" requests={requested} emptyText="대기 중인 상담 요청이 없습니다." />
        <ConsultationMemoColumn title="상담 예정" requests={scheduled} emptyText="승인된 상담 일정이 없습니다." />
        <ConsultationMemoColumn title="상담 완료 기록" requests={completed} emptyText="완료된 상담 기록이 없습니다." />
      </div>
    </div>
  );
}

function ConsultationMemoColumn({
  title,
  requests,
  emptyText,
}: {
  title: string;
  requests: typeof mockConsultationRequests;
  emptyText: string;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
      <h4 className="font-bold text-slate-950">{title}</h4>
      {requests.length === 0 ? <p className="mt-3 text-sm leading-6 text-slate-600">{emptyText}</p> : null}
      <div className="mt-3 grid gap-3">
        {requests.map((request) => (
          <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-slate-950">{request.topic}</p>
              <ConsultationStatusBadge status={request.status} />
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              {request.preferredDate} {request.preferredTime}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-700">{request.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function StudentClassPickerModal({
  student,
  enrolledClasses,
  accessToken,
  onClose,
  onCompleted,
}: {
  student: AcademyStudentResponse;
  enrolledClasses: AcademyClassResponse[];
  accessToken: string | null;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [classes, setClasses] = useState<AcademyClassResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [addingClassId, setAddingClassId] = useState<number | null>(null);
  const enrolledClassIds = new Set(enrolledClasses.map((academyClass) => academyClass.classId));

  useEffect(() => {
    if (!accessToken) return;
    let isMounted = true;

    void Promise.resolve().then(() => {
      if (!isMounted) return;

      setIsLoading(true);
      setErrorMessage("");
      getAcademyClasses(accessToken, { status: "ACTIVE" })
        .then((data) => {
          if (isMounted) setClasses(data);
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
  }, [accessToken]);

  const handleAddClass = async (academyClass: AcademyClassResponse) => {
    if (!accessToken || enrolledClassIds.has(academyClass.classId)) return;

    setAddingClassId(academyClass.classId);
    setErrorMessage("");
    try {
      await addAcademyClassStudent(academyClass.classId, student.id, accessToken);
      onCompleted();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setAddingClassId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">수업 추가</h2>
              <p className="mt-1 text-sm text-slate-600">{student.name} 학생이 수강할 수업을 선택합니다.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
              aria-label="수업 추가 닫기"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-3 px-5 py-5">
          {errorMessage ? (
            <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {errorMessage}
            </p>
          ) : null}

          {isLoading ? <p className="text-sm font-semibold text-slate-600">수업 목록을 불러오고 있습니다.</p> : null}

          {!isLoading && classes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
              추가할 수 있는 수업이 없습니다.
            </p>
          ) : null}

          {classes.map((academyClass) => {
            const alreadyEnrolled = enrolledClassIds.has(academyClass.classId);
            return (
              <div key={academyClass.classId} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-950">{academyClass.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {academyClass.dayLabel} {academyClass.startTime} - {academyClass.endTime}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {academyClass.classroomName} · {academyClass.teacherName ?? "담당 선생님 미지정"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAddClass(academyClass)}
                    disabled={alreadyEnrolled || addingClassId !== null}
                    className={`inline-flex h-10 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-bold transition ${
                      alreadyEnrolled
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-blue-700 text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    }`}
                  >
                    {alreadyEnrolled ? "이미 수강 중" : addingClassId === academyClass.classId ? "추가 중" : "추가"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function GuardianConnectionBadge({ student }: { student: AcademyStudentResponse }) {
  if (student.guardianAccountLinked) {
    return (
      <span className="inline-flex w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
        보호자 계정 연결됨
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-500">
      보호자 계정 미연결
    </span>
  );
}

function StudentDetailPlaceholder({
  title,
  description,
  actionLabel,
}: {
  title: string;
  description: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
      {actionLabel ? (
        <button
          type="button"
          disabled
          className="mt-5 inline-flex h-11 cursor-not-allowed items-center justify-center rounded-2xl bg-slate-200 px-4 text-sm font-bold text-slate-500"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function AcademyTeachersPage() {
  const { accessToken, user } = useAuth();
  const isPendingApproval = user?.status === "PENDING_APPROVAL";
  const [teachers, setTeachers] = useState<AcademyTeacherResponse[]>([]);
  const [invitations, setInvitations] = useState<TeacherInvitationResponse[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInvitationOpen, setIsInvitationOpen] = useState(false);

  const loadTeachers = useCallback(() => {
    if (!accessToken || isPendingApproval) {
      return;
    }

    setIsLoading(true);
    void Promise.all([
      getAcademyTeachers(accessToken),
      getAcademyTeacherInvitations(accessToken),
    ])
      .then(([teacherResponses, invitationResponses]) => {
        setTeachers(teacherResponses);
        setInvitations(invitationResponses);
        setErrorMessage("");
      })
      .catch((error) => {
        setErrorMessage(getTeacherInvitationErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, isPendingApproval]);

  useEffect(() => {
    if (!accessToken || isPendingApproval) {
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
          setErrorMessage("");
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
  }, [accessToken, isPendingApproval]);

  return (
    <AcademyShell
      title="선생님 관리"
      description="학원에 소속된 선생님과 보낸 초대장을 관리합니다."
      actions={<TeacherInvitationButton onClick={() => setIsInvitationOpen(true)} />}
    >
      <div className="space-y-6">
        {errorMessage ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="whitespace-pre-line text-sm font-semibold text-red-600">{errorMessage}</p>
            <button
              type="button"
              onClick={loadTeachers}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >
              다시 시도
            </button>
          </div>
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
                action={<TeacherInvitationButton onClick={() => setIsInvitationOpen(true)} />}
              />
            </div>
          ) : null}

          {teachers.length > 0 ? (
            <div className="mt-5 overflow-hidden rounded-3xl border border-slate-200">
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
                description="선생님 전화번호로 계정을 확인한 뒤 초대장을 보내세요."
                action={<TeacherInvitationButton onClick={() => setIsInvitationOpen(true)} />}
              />
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {invitations.map((invitation) => (
                <div key={invitation.invitationId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-bold text-slate-950">{invitation.teacherPhone}</h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {invitation.teacherEmail ?? "비회원 선생님 초대"}
                      </p>
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

      {isInvitationOpen ? (
        <AcademyTeacherInvitationModal
          accessToken={accessToken}
          onClose={() => setIsInvitationOpen(false)}
          onCompleted={loadTeachers}
        />
      ) : null}
    </AcademyShell>
  );
}

export function AcademyTeacherNewPage() {
  const { accessToken } = useAuth();

  return (
    <AcademyShell title="선생님 초대" description="선생님 관리는 목록 화면에서 초대장을 보내는 흐름을 권장합니다.">
      <AcademyCard>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">선생님 초대 보내기</h2>
            <p className="mt-1 text-sm text-slate-600">직접 접근한 경우에도 이 화면에서 초대장을 보낼 수 있습니다.</p>
          </div>
          <AcademyLinkButton href="/academy/teachers">선생님 관리로 이동</AcademyLinkButton>
        </div>
        <TeacherInvitationForm accessToken={accessToken} />
      </AcademyCard>
    </AcademyShell>
  );
}

function AcademyTeacherInvitationModal({
  accessToken,
  onClose,
  onCompleted,
}: {
  accessToken: string | null;
  onClose: () => void;
  onCompleted: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">선생님 초대</h2>
              <p className="mt-1 text-sm text-slate-600">전화번호로 계정을 확인한 뒤 초대를 보냅니다.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
              aria-label="선생님 초대 닫기"
            >
              ×
            </button>
          </div>
        </div>
        <div className="px-5 py-5">
          <TeacherInvitationForm
            accessToken={accessToken}
            onCompleted={() => {
              onCompleted();
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function TeacherInvitationForm({
  accessToken,
  onCompleted,
}: {
  accessToken: string | null;
  onCompleted?: () => void;
}) {
  const [form, setForm] = useState<TeacherInvitationCreateRequest>({
    teacherUserId: null,
    teacherPhone: "",
    message: fallbackInvitationMessage(),
  });
  const [candidates, setCandidates] = useState<CandidateDto[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
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

  const handleSearchCandidates = async () => {
    if (!accessToken || !form.teacherPhone.trim()) {
      setErrorMessage("선생님 전화번호를 입력한 뒤 계정을 확인해 주세요.");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setSuccessMessage("");
    setErrorMessage("");
    setForm((current) => ({ ...current, teacherUserId: null }));

    try {
      const response = await searchAccountCandidates("TEACHER", form.teacherPhone.trim(), accessToken);
      setCandidates(response.candidates);
      setHasSearched(true);
    } catch (error) {
      setCandidates([]);
      setErrorMessage(getTeacherInvitationErrorMessage(error));
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setErrorMessage("초대장을 보내지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.");
      return;
    }

    if (!hasSearched) {
      setErrorMessage("초대장을 보내기 전에 전화번호로 기존 선생님 계정을 확인해 주세요.");
      return;
    }

    if (candidates.length > 0 && !form.teacherUserId) {
      setErrorMessage("초대장을 보낼 선생님 계정을 선택해 주세요.");
      return;
    }

    setIsSending(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await createTeacherInvitation(
        {
          teacherUserId: form.teacherUserId ?? null,
          teacherPhone: form.teacherPhone.trim(),
          message: form.message,
        },
        accessToken,
      );
      setForm((current) => ({
        teacherUserId: null,
        teacherPhone: "",
        message: current.message,
      }));
      setCandidates([]);
      setHasSearched(false);
      setSuccessMessage("초대장을 보냈습니다.");
      onCompleted?.();
    } catch (error) {
      setErrorMessage(getTeacherInvitationErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {successMessage ? (
        <p className="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mb-5 whitespace-pre-line rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {errorMessage}
        </p>
      ) : null}

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <AcademyTextField
            label="선생님 전화번호"
            value={form.teacherPhone}
            onChange={(value) => {
              setForm((current) => ({ ...current, teacherPhone: value, teacherUserId: null }));
              setCandidates([]);
              setHasSearched(false);
            }}
            required
          />
          <button
            type="button"
            onClick={handleSearchCandidates}
            disabled={isSearching || !form.teacherPhone.trim()}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            {isSearching ? "확인 중" : "계정 확인"}
          </button>
        </div>

        {hasSearched && candidates.length > 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-bold text-blue-900">가입된 선생님 계정을 찾았습니다.</h3>
            <p className="mt-1 text-sm text-blue-800">선택한 선생님에게 초대장을 보냅니다.</p>
            <div className="mt-3 grid gap-2">
              {candidates.map((candidate) => {
                const isSelected = form.teacherUserId === candidate.userId;
                return (
                  <button
                    key={candidate.userId}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, teacherUserId: candidate.userId }))}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      isSelected
                        ? "border-blue-600 bg-white ring-2 ring-blue-100"
                        : "border-blue-100 bg-white hover:border-blue-300"
                    }`}
                  >
                    <span className="block text-sm font-bold text-slate-950">{candidate.name}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-600">
                      {candidate.phone} · {candidate.email}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {hasSearched && candidates.length === 0 ? (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <h3 className="text-sm font-bold text-amber-900">가입된 선생님 계정을 찾지 못했습니다.</h3>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              비회원 선생님에게 초대장을 남겨두고, 해당 전화번호로 가입하면 초대장을 확인할 수 있습니다.
            </p>
          </div>
        ) : null}

        <label className="block">
          <span className="text-sm font-bold text-slate-700">초대 메시지</span>
          <textarea
            value={form.message}
            onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSending || !hasSearched || (candidates.length > 0 && !form.teacherUserId)}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            {isSending ? "전송 중" : "초대 보내기"}
          </button>
        </div>
      </form>
    </>
  );
}

function TeacherInvitationButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800"
    >
      선생님 초대
    </button>
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
            <FieldPreview label="상태" value="전체" />
            <FieldPreview label="상담일" value="전체" />
            <FieldPreview label="상담 유형" value="전체" />
            <FieldPreview label="담당자" value="전체" />
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
      <EmptyState
        title="신규 상담 등록 기능은 준비 중입니다."
        description="입력 항목이 확정되기 전까지는 목록 화면에서 상담 내역만 확인할 수 있습니다."
        action={<AcademyLinkButton href="/academy/consultations">신규 상담으로 이동</AcademyLinkButton>}
      />
    </AcademyShell>
  );
}

export function AcademyInvoicesPage() {
  return (
    <AcademyShell title="청구서/수납" description="학생별 청구서와 수강료 납부 상태를 확인합니다.">
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ["이번 달 청구서", "0건"],
            ["미납 목록", "0건"],
            ["납부 완료", "0건"],
            ["청구서 미발송", "0건"],
          ].map(([label, value]) => (
            <AcademyCard key={label}>
              <p className="text-sm font-semibold text-slate-500">{label}</p>
              <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
            </AcademyCard>
          ))}
        </div>
        <EmptyState
          title="아직 청구서가 없습니다."
          description="청구서 생성과 수납 상태 관리는 도메인 API 연결 후 제공됩니다."
        />
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
  const { accessToken, user } = useAuth();
  const isPendingApproval = user?.status === "PENDING_APPROVAL";
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
    if (!accessToken || isPendingApproval) {
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
  }, [accessToken, isPendingApproval]);

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
      <div className="space-y-6">
        <AcademyCard>
          {isLoading ? (
            <p className="text-sm font-semibold text-slate-600">학원 정보를 불러오고 있습니다.</p>
          ) : null}

          {successMessage ? (
            <p className="mb-5 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
              {successMessage}
            </p>
          ) : null}

          {errorMessage ? (
            <p className="mb-5 whitespace-pre-line rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
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
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                {isSaving ? "저장 중" : "저장"}
              </button>
            </div>
          </form>
        </AcademyCard>
        <ConsultationAvailabilitySettings />
      </div>
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
        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
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
