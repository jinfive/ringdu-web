"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  acceptParentStudentInvitation,
  acceptStudentAcademyInvitation,
  getStudentAcademyInvitations,
  rejectStudentAcademyInvitation,
  ApiError,
  createParentStudentInvitation,
  createStudentParentInvitation,
  getParentInvitations,
  getParentStudents,
  getStudentInvitations,
  getStudentParents,
  rejectParentStudentInvitation,
} from "@/lib/api";
import {
  attendanceMonthOptions,
  attendanceStatusLabels,
  attendanceStatusStyles,
  attendanceYearOptions,
  getCurrentAttendanceFilter,
  isSameAttendanceMonth,
  mockParentAttendanceRecords,
  mockStudentAttendanceRecords,
  type AttendanceRecordListItem,
  type AttendanceStatus,
} from "@/types/attendance";
import type {
  ParentStudentInvitationResponse,
  AcademyStudentInvitationResponse,
  ParentStudentInvitationStatus,
  ParentStudentRelationResponse,
} from "@/types/auth";

type FamilyRole = "PARENT" | "STUDENT";
type PageMode = "dashboard" | "invitations" | "attendance";
type InvitationTab = "connected" | "received" | "sent";

type PageConfig = {
  role: FamilyRole;
  homePath: string;
  invitationsPath: string;
  attendancePath: string;
  title: string;
  invitationTitle: string;
  attendanceTitle: string;
  sendTitle: string;
  managementTitle: string;
  managementDescription: string;
  managementButtonLabel: string;
  sentMessage: string;
  emailLabel: string;
  phoneLabel: string;
  connectedTitle: string;
  connectedEmptyTitle: string;
  connectedEmptyDescription: string;
  receivedEmptyTitle: string;
  sentEmptyTitle: string;
  defaultMessage: string;
};

const configs: Record<FamilyRole, PageConfig> = {
  PARENT: {
    role: "PARENT",
    homePath: "/parent",
    invitationsPath: "/parent/invitations",
    attendancePath: "/parent/attendance",
    title: "학부모 홈",
    invitationTitle: "자녀 연결",
    attendanceTitle: "자녀 출석 기록",
    sendTitle: "자녀에게 연결 요청 보내기",
    managementTitle: "자녀 연결",
    managementDescription: "자녀와 연결하면 출석, 시간표, 청구 정보를 확인할 수 있습니다.",
    managementButtonLabel: "연결 관리",
    sentMessage: "자녀 연결 요청을 보냈습니다.",
    emailLabel: "학생 이메일(선택)",
    phoneLabel: "학생 전화번호",
    connectedTitle: "연결된 자녀",
    connectedEmptyTitle: "아직 연결된 자녀가 없습니다.",
    connectedEmptyDescription: "자녀가 연결되면 시간표, 출석, 숙제 정보를 확인할 수 있습니다.",
    receivedEmptyTitle: "아직 받은 연결 초대장이 없습니다.",
    sentEmptyTitle: "보낸 연결 초대장이 없습니다.",
    defaultMessage: "자녀 연결 요청입니다.",
  },
  STUDENT: {
    role: "STUDENT",
    homePath: "/student",
    invitationsPath: "/student/invitations",
    attendancePath: "/student/attendance",
    title: "학생 홈",
    invitationTitle: "보호자 연결",
    attendanceTitle: "내 출석 기록",
    sendTitle: "보호자에게 연결 요청 보내기",
    managementTitle: "보호자 연결",
    managementDescription: "보호자와 연결하면 학원 생활 정보를 함께 확인할 수 있습니다.",
    managementButtonLabel: "연결 관리",
    sentMessage: "보호자 연결 요청을 보냈습니다.",
    emailLabel: "보호자 이메일(선택)",
    phoneLabel: "보호자 전화번호",
    connectedTitle: "연결된 보호자",
    connectedEmptyTitle: "아직 연결된 보호자가 없습니다.",
    connectedEmptyDescription: "보호자가 연결되면 학원 생활 정보를 함께 확인할 수 있습니다.",
    receivedEmptyTitle: "아직 받은 연결 초대장이 없습니다.",
    sentEmptyTitle: "보낸 연결 초대장이 없습니다.",
    defaultMessage: "보호자 연결 요청입니다.",
  },
};

export function ParentStudentDashboardPage({ role }: { role: FamilyRole }) {
  const config = configs[role];
  const state = useParentStudentState(config);
  const receivedPending = useMemo(
    () => state.invitations.filter((invitation) => invitation.direction === "RECEIVED" && invitation.status === "PENDING"),
    [state.invitations],
  );
  const sent = useMemo(
    () => state.invitations.filter((invitation) => invitation.direction === "SENT"),
    [state.invitations],
  );

  return (
    <FamilyShell config={config} mode="dashboard">
      <div className="space-y-6">
        {state.errorMessage ? <AlertMessage>{state.errorMessage}</AlertMessage> : null}
        {state.successMessage ? <SuccessMessage>{state.successMessage}</SuccessMessage> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="받은 초대장" value={`${receivedPending.length}건`} />
          <SummaryCard label={config.connectedTitle} value={`${state.relations.length}명`} />
          <SummaryCard label="보낸 초대장" value={`${sent.length}건`} />
        </div>

        <ConnectionManagementCard config={config} />
        <AttendanceSummaryCard role={role} />

        <section className="grid gap-6 xl:grid-cols-2">
          <FamilyCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-950">받은 초대장</h2>
                <p className="mt-1 text-sm text-slate-600">대기 중인 연결 초대장을 확인합니다.</p>
              </div>
              <FamilyLinkButton href={config.invitationsPath}>초대장 확인하기</FamilyLinkButton>
            </div>
            <InvitationList
              config={config}
              invitations={receivedPending.slice(0, 3)}
              isLoading={state.isLoading}
              processingId={state.processingId}
              onProcess={state.processInvitation}
              emptyTitle={config.receivedEmptyTitle}
            />
          </FamilyCard>

          {role === "STUDENT" ? (
            <FamilyCard>
              <h2 className="text-lg font-bold text-slate-950">학원 연결 초대장</h2>
              <p className="mt-1 text-sm text-slate-600">학원에서 보낸 학생 등록 초대장입니다.</p>
              <AcademyInvitationList
                invitations={state.academyInvitations}
                isLoading={state.isLoading}
                processingId={state.processingId}
                onProcess={state.processAcademyInvitation}
              />
            </FamilyCard>
          ) : null}

          <RelationsPanel config={config} state={state} />

          <FamilyCard>
            <h2 className="text-lg font-bold text-slate-950">보낸 초대장</h2>
            <InvitationList
              config={config}
              invitations={sent.slice(0, 3)}
              isLoading={state.isLoading}
              processingId={state.processingId}
              onProcess={state.processInvitation}
              emptyTitle={config.sentEmptyTitle}
              readonly
            />
          </FamilyCard>
        </section>
      </div>
    </FamilyShell>
  );
}

function AttendanceSummaryCard({ role }: { role: FamilyRole }) {
  const title = role === "PARENT" ? "자녀 출석 기록" : "내 출석 기록";
  const description = role === "PARENT" ? "자녀의 학원별 출석 상태를 확인합니다." : "학원별 출석 상태를 확인합니다.";
  const href = role === "PARENT" ? "/parent/attendance" : "/student/attendance";

  return (
    <FamilyCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
          조회 전용
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-600">
          학원별, 기간별 출석 기록 화면으로 이동합니다.
        </p>
        <FamilyLinkButton href={href}>출석 기록 보기</FamilyLinkButton>
      </div>
    </FamilyCard>
  );
}

export function ParentStudentAttendancePage({ role }: { role: FamilyRole }) {
  const config = configs[role];
  const state = useParentStudentState(config);
  const defaultFilter = getCurrentAttendanceFilter();
  const [selectedYear, setSelectedYear] = useState(defaultFilter.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultFilter.month);
  const [selectedAcademyId, setSelectedAcademyId] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState("all");
  const records = role === "PARENT" ? mockParentAttendanceRecords : mockStudentAttendanceRecords;
  const academyOptions = getAcademyOptions(records);
  const childOptions = role === "PARENT" ? getChildOptions(records, state.relations) : [];
  const filteredRecords = records.filter((record) => {
    const academyMatched = selectedAcademyId === "all" || record.academyId === selectedAcademyId;
    const studentMatched = role !== "PARENT" || selectedStudentId === "all" || record.studentId === selectedStudentId;
    return academyMatched && studentMatched && isSameAttendanceMonth(record.attendanceDate, selectedYear, selectedMonth);
  });

  return (
    <FamilyShell config={config} mode="attendance">
      <div className="space-y-6">
        <FamilyCard>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{config.attendanceTitle}</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {role === "PARENT" ? "자녀별, 학원별 출석 기록을 확인합니다." : "학원별 출석 기록을 확인합니다."}
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
              API 연동 예정
            </span>
          </div>
          <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            {role === "PARENT"
              ? "TODO: GET /api/parent/children/{studentProfileId}/attendance-records?academyId=&year=&month= 연동 예정"
              : "TODO: GET /api/student/attendance-records?academyId=&year=&month= 연동 예정"}
          </p>
        </FamilyCard>

        <FamilyAttendanceFilter
          role={role}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          selectedAcademyId={selectedAcademyId}
          selectedStudentId={selectedStudentId}
          academyOptions={academyOptions}
          childOptions={childOptions}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          onAcademyChange={setSelectedAcademyId}
          onStudentChange={setSelectedStudentId}
        />

        <FamilyAttendanceRecords role={role} records={filteredRecords} />
      </div>
    </FamilyShell>
  );
}

function FamilyAttendanceFilter({
  role,
  selectedYear,
  selectedMonth,
  selectedAcademyId,
  selectedStudentId,
  academyOptions,
  childOptions,
  onYearChange,
  onMonthChange,
  onAcademyChange,
  onStudentChange,
}: {
  role: FamilyRole;
  selectedYear: number;
  selectedMonth: number;
  selectedAcademyId: string;
  selectedStudentId: string;
  academyOptions: Array<{ id: string; name: string }>;
  childOptions: Array<{ id: string; name: string }>;
  onYearChange: (value: number) => void;
  onMonthChange: (value: number) => void;
  onAcademyChange: (value: string) => void;
  onStudentChange: (value: string) => void;
}) {
  return (
    <FamilyCard>
      <div className={`grid gap-3 ${role === "PARENT" ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
        {role === "PARENT" ? (
          <FilterSelect label="자녀" value={selectedStudentId} onChange={onStudentChange}>
            <option value="all">전체 자녀</option>
            {childOptions.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
              </option>
            ))}
          </FilterSelect>
        ) : null}
        <FilterSelect label="학원" value={selectedAcademyId} onChange={onAcademyChange}>
          <option value="all">전체 학원</option>
          {academyOptions.map((academy) => (
            <option key={academy.id} value={academy.id}>
              {academy.name}
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="년도" value={String(selectedYear)} onChange={(value) => onYearChange(Number(value))}>
          {attendanceYearOptions.map((year) => (
            <option key={year} value={year}>
              {year}년
            </option>
          ))}
        </FilterSelect>
        <FilterSelect label="월" value={String(selectedMonth)} onChange={(value) => onMonthChange(Number(value))}>
          {attendanceMonthOptions.map((month) => (
            <option key={month} value={month}>
              {month}월
            </option>
          ))}
        </FilterSelect>
      </div>
    </FamilyCard>
  );
}

function FamilyAttendanceRecords({ role, records }: { role: FamilyRole; records: AttendanceRecordListItem[] }) {
  if (records.length === 0) {
    return (
      <FamilyCard>
        <EmptyState title="선택한 기간의 출석 기록이 없습니다." description="출석 기록이 생기면 이곳에 표시됩니다." />
      </FamilyCard>
    );
  }

  return (
    <FamilyCard>
      <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white sm:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">날짜</th>
              {role === "PARENT" ? <th className="px-4 py-3">자녀</th> : null}
              <th className="px-4 py-3">학원명</th>
              <th className="px-4 py-3">수업명</th>
              <th className="px-4 py-3">출석 상태</th>
              <th className="px-4 py-3">메모</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((record) => (
              <tr key={record.id}>
                <td className="px-4 py-4 font-semibold text-slate-700">{record.attendanceDate}</td>
                {role === "PARENT" ? <td className="px-4 py-4 font-bold text-slate-950">{record.studentName ?? "-"}</td> : null}
                <td className="px-4 py-4 font-semibold text-slate-700">{record.academyName}</td>
                <td className="px-4 py-4 font-bold text-slate-950">{record.className}</td>
                <td className="px-4 py-4">
                  <FamilyAttendanceStatusBadge status={record.status} />
                </td>
                <td className="px-4 py-4 text-slate-600">{record.memo || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:hidden">
        {records.map((record) => (
          <div key={record.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-500">{record.attendanceDate}</p>
                <h3 className="mt-1 font-bold text-slate-950">{role === "PARENT" ? record.studentName : record.className}</h3>
                <p className="mt-1 text-sm text-slate-600">
                  {record.academyName} · {role === "PARENT" ? record.className : record.memo || "메모 없음"}
                </p>
                {role === "PARENT" ? <p className="mt-2 text-sm text-slate-600">{record.memo || "메모 없음"}</p> : null}
              </div>
              <FamilyAttendanceStatusBadge status={record.status} />
            </div>
          </div>
        ))}
      </div>
    </FamilyCard>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function FamilyAttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${attendanceStatusStyles[status]}`}>
      {attendanceStatusLabels[status]}
    </span>
  );
}

function getAcademyOptions(records: AttendanceRecordListItem[]) {
  return Array.from(new Map(records.map((record) => [record.academyId, { id: record.academyId, name: record.academyName }])).values());
}

function getChildOptions(records: AttendanceRecordListItem[], relations: ParentStudentRelationResponse[]) {
  const relationOptions = relations.map((relation) => ({
    id: String(relation.studentUserId),
    name: relation.studentName,
  }));
  const recordOptions = records
    .filter((record) => record.studentId && record.studentName)
    .map((record) => ({
      id: record.studentId ?? "",
      name: record.studentName ?? "",
    }));

  return Array.from(new Map([...relationOptions, ...recordOptions].map((child) => [child.id, child])).values());
}

export function ParentStudentInvitationsPage({ role }: { role: FamilyRole }) {
  const config = configs[role];
  const state = useParentStudentState(config);
  const received = state.invitations.filter((invitation) => invitation.direction === "RECEIVED");
  const sent = state.invitations.filter((invitation) => invitation.direction === "SENT");
  const [activeTab, setActiveTab] = useState<InvitationTab>("connected");
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);

  return (
    <FamilyShell config={config} mode="invitations">
      <div className="space-y-6">
        {state.errorMessage ? <AlertMessage>{state.errorMessage}</AlertMessage> : null}
        {state.successMessage ? <SuccessMessage>{state.successMessage}</SuccessMessage> : null}

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label={config.connectedTitle} value={`${state.relations.length}명`} />
          <SummaryCard label="받은 요청" value={`${received.length}건`} />
          <SummaryCard label="보낸 요청" value={`${sent.length}건`} />
        </div>

        <FamilyCard>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">{config.managementTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{config.managementDescription}</p>
            </div>
            <FamilyButton onClick={() => setIsRequestFormOpen(true)}>
              {config.role === "PARENT" ? "자녀에게 요청 보내기" : "보호자에게 요청 보내기"}
            </FamilyButton>
          </div>
        </FamilyCard>

        <TabNav activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "connected" ? <RelationsPanel config={config} state={state} /> : null}
        {activeTab === "received" ? (
          <FamilyCard>
            <h2 className="text-lg font-bold text-slate-950">받은 요청</h2>
            <InvitationList
              config={config}
              invitations={received}
              isLoading={state.isLoading}
              processingId={state.processingId}
              onProcess={state.processInvitation}
              emptyTitle={config.receivedEmptyTitle}
            />
          </FamilyCard>
        ) : null}
        {activeTab === "sent" ? (
          <FamilyCard>
            <h2 className="text-lg font-bold text-slate-950">보낸 요청</h2>
            <InvitationList
              config={config}
              invitations={sent}
              isLoading={state.isLoading}
              processingId={state.processingId}
              onProcess={state.processInvitation}
              emptyTitle={config.sentEmptyTitle}
              readonly
            />
          </FamilyCard>
        ) : null}

        {role === "STUDENT" ? (
          <FamilyCard>
            <h2 className="text-lg font-bold text-slate-950">학원 연결 초대장</h2>
            <p className="mt-1 text-sm text-slate-600">학원에서 보낸 학생 등록 초대장입니다.</p>
            <AcademyInvitationList
              invitations={state.academyInvitations}
              isLoading={state.isLoading}
              processingId={state.processingId}
              onProcess={state.processAcademyInvitation}
            />
          </FamilyCard>
        ) : null}

        {isRequestFormOpen ? (
          <InvitationModal config={config} state={state} onClose={() => setIsRequestFormOpen(false)} />
        ) : null}
      </div>
    </FamilyShell>
  );
}


function useParentStudentState(config: PageConfig) {
  const { accessToken } = useAuth();
  const [invitations, setInvitations] = useState<ParentStudentInvitationResponse[]>([]);
  const [academyInvitations, setAcademyInvitations] = useState<AcademyStudentInvitationResponse[]>([]);
  const [relations, setRelations] = useState<ParentStudentRelationResponse[]>([]);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(config.defaultMessage);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = async () => {
    if (!accessToken) {
      return;
    }

    try {
      const [invitationResponses, relationResponses, academyInvitationResponses] = await Promise.all([
        config.role === "PARENT" ? getParentInvitations(accessToken) : getStudentInvitations(accessToken),
        config.role === "PARENT" ? getParentStudents(accessToken) : getStudentParents(accessToken),
        config.role === "STUDENT" ? getStudentAcademyInvitations(accessToken) : Promise.resolve([]),
      ]);
      setInvitations(invitationResponses);
      setRelations(relationResponses);
      setAcademyInvitations(academyInvitationResponses as AcademyStudentInvitationResponse[]);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(getFamilyErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    void Promise.all([
      config.role === "PARENT" ? getParentInvitations(accessToken) : getStudentInvitations(accessToken),
      config.role === "PARENT" ? getParentStudents(accessToken) : getStudentParents(accessToken),
      config.role === "STUDENT" ? getStudentAcademyInvitations(accessToken) : Promise.resolve([]),
    ])
      .then(([invitationResponses, relationResponses, academyInvitationResponses]) => {
        if (isMounted) {
          setInvitations(invitationResponses);
          setRelations(relationResponses);
          setAcademyInvitations(academyInvitationResponses as AcademyStudentInvitationResponse[]);
          setErrorMessage("");
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getFamilyErrorMessage(error));
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
  }, [accessToken, config.role]);

  const submitInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) {
      return false;
    }

    setIsSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const normalizedEmail = email.trim() || null;
      const normalizedPhone = phone.trim();
      const normalizedMessage = message.trim();
      if (config.role === "PARENT") {
        await createParentStudentInvitation({
          studentEmail: normalizedEmail,
          studentPhone: normalizedPhone,
          message: normalizedMessage,
        }, accessToken);
      } else {
        await createStudentParentInvitation({
          parentEmail: normalizedEmail,
          parentPhone: normalizedPhone,
          message: normalizedMessage,
        }, accessToken);
      }
      setEmail("");
      setPhone("");
      setMessage(config.defaultMessage);
      setSuccessMessage(config.sentMessage);
      await load();
      return true;
    } catch (error) {
      setErrorMessage(getFamilyErrorMessage(error));
      return false;
    } finally {
      setIsSending(false);
    }
  };

  const processInvitation = async (invitationId: number, action: "accept" | "reject") => {
    if (!accessToken) {
      return;
    }

    setProcessingId(invitationId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (action === "accept") {
        await acceptParentStudentInvitation(invitationId, accessToken);
      } else {
        await rejectParentStudentInvitation(invitationId, accessToken);
      }
      await load();
    } catch (error) {
      setErrorMessage(getFamilyErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  const processAcademyInvitation = async (invitationId: number, action: "accept" | "reject") => {
    if (!accessToken) {
      return;
    }

    setProcessingId(invitationId);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (action === "accept") {
        await acceptStudentAcademyInvitation(invitationId, accessToken);
      } else {
        await rejectStudentAcademyInvitation(invitationId, accessToken);
      }
      await load();
    } catch (error) {
      setErrorMessage(getFamilyErrorMessage(error));
    } finally {
      setProcessingId(null);
    }
  };

  return {
    invitations,
    academyInvitations,
    relations,
    email,
    setEmail,
    phone,
    setPhone,
    message,
    setMessage,
    isLoading,
    isSending,
    processingId,
    errorMessage,
    successMessage,
    submitInvitation,
    processInvitation,
    processAcademyInvitation,
  };
}
function FamilyShell({ config, mode, children }: { config: PageConfig; mode: PageMode; children: ReactNode }) {
  const { user, logout } = useAuth();
  const menu = [
    { href: config.homePath, label: config.title },
    { href: config.invitationsPath, label: config.invitationTitle },
    { href: config.attendancePath, label: config.attendanceTitle },
  ];
  const pageTitle =
    mode === "dashboard" ? config.title : mode === "invitations" ? config.invitationTitle : config.attendanceTitle;

  return (
    <RoleGuard allowedRole={config.role}>
      <main className="min-h-screen text-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
          <aside className="hidden w-60 shrink-0 border-r border-white/70 bg-white/80 px-5 py-6 backdrop-blur lg:block">
            <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
              Ringdu
            </Link>
            <p className="mt-2 text-sm font-medium text-slate-500">{config.role === "PARENT" ? "학부모" : "학생"}</p>
            <nav className="mt-8 space-y-1">
              {menu.map((item) => (
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
                  <p className="mt-2 text-xs font-semibold uppercase text-blue-600 lg:mt-0">{config.role}</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-950">{pageTitle}</h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">{user?.name ?? "사용자"}님</span>
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
                {menu.map((item) => (
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

function ConnectionManagementCard({ config }: { config: PageConfig }) {
  return (
    <FamilyCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{config.managementTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{config.managementDescription}</p>
        </div>
        <FamilyLinkButton href={config.invitationsPath}>{config.managementButtonLabel}</FamilyLinkButton>
      </div>
    </FamilyCard>
  );
}

function TabNav({
  activeTab,
  onChange,
}: {
  activeTab: InvitationTab;
  onChange: (tab: InvitationTab) => void;
}) {
  const tabs: Array<{ id: InvitationTab; label: string }> = [
    { id: "connected", label: "연결됨" },
    { id: "received", label: "받은 요청" },
    { id: "sent", label: "보낸 요청" },
  ];

  return (
    <div className="flex rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`min-h-11 flex-1 rounded-xl px-3 text-sm font-semibold transition ${
            activeTab === tab.id ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function InvitationForm({
  config,
  state,
  onSubmitted,
}: {
  config: PageConfig;
  state: ReturnType<typeof useParentStudentState>;
  onSubmitted?: () => void;
}) {
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    const sent = await state.submitInvitation(event);
    if (sent) {
      onSubmitted?.();
    }
  };

  return (
    <FamilyCard>
      <h2 className="text-lg font-bold text-slate-950">{config.sendTitle}</h2>
      <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField label={config.emailLabel} value={state.email} onChange={state.setEmail} />
          <TextField label={config.phoneLabel} value={state.phone} onChange={state.setPhone} required />
        </div>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">초대 메시지</span>
          <textarea
            value={state.message}
            onChange={(event) => state.setMessage(event.target.value)}
            className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={state.isSending}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            {state.isSending ? "전송 중" : "요청 보내기"}
          </button>
        </div>
      </form>
    </FamilyCard>
  );
}

function InvitationModal({
  config,
  state,
  onClose,
}: {
  config: PageConfig;
  state: ReturnType<typeof useParentStudentState>;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">{config.sendTitle}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {config.role === "PARENT" ? "학생에게 자녀 연결 초대장을 보냅니다." : "보호자에게 연결 초대장을 보냅니다."}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
              aria-label="연결 초대 닫기"
            >
              ×
            </button>
          </div>
        </div>
        <div className="px-5 py-5">
          <InvitationForm config={config} state={state} onSubmitted={onClose} />
        </div>
      </div>
    </div>
  );
}

function InvitationList({
  config,
  invitations,
  isLoading,
  processingId,
  onProcess,
  emptyTitle,
  readonly = false,
}: {
  config: PageConfig;
  invitations: ParentStudentInvitationResponse[];
  isLoading: boolean;
  processingId: number | null;
  onProcess: (invitationId: number, action: "accept" | "reject") => Promise<void>;
  emptyTitle: string;
  readonly?: boolean;
}) {
  if (isLoading) {
    return <p className="mt-5 text-sm font-semibold text-slate-600">초대장을 불러오고 있습니다.</p>;
  }

  if (invitations.length === 0) {
    return (
      <EmptyState title={emptyTitle} description="초대장이 도착하면 이곳에 표시됩니다." />
    );
  }

  return (
    <div className="mt-5 grid gap-4">
      {invitations.map((invitation) => (
        <div key={invitation.invitationId} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{getInvitationTitle(config, invitation)}</h3>
                <StatusBadge status={invitation.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {invitation.direction === "SENT"
                  ? invitation.receiverEmail || invitation.receiverPhone
                  : `${invitation.requesterName}님이 보냄`}
              </p>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {invitation.message || "초대 메시지가 없습니다."}
              </p>
              <p className="mt-4 text-xs font-semibold text-slate-500">
                {invitation.direction === "SENT" ? "보낸 날짜" : "받은 날짜"} {formatDate(invitation.createdAt)}
              </p>
            </div>

            {!readonly && invitation.direction === "RECEIVED" && invitation.status === "PENDING" ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={processingId === invitation.invitationId}
                  onClick={() => void onProcess(invitation.invitationId, "accept")}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  수락
                </button>
                <button
                  type="button"
                  disabled={processingId === invitation.invitationId}
                  onClick={() => void onProcess(invitation.invitationId, "reject")}
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
  );
}


function AcademyInvitationList({
  invitations,
  isLoading,
  processingId,
  onProcess,
}: {
  invitations: AcademyStudentInvitationResponse[];
  isLoading: boolean;
  processingId: number | null;
  onProcess: (invitationId: number, action: "accept" | "reject") => Promise<void>;
}) {
  if (isLoading) {
    return <p className="mt-5 text-sm font-semibold text-slate-600">학원 초대장을 불러오고 있습니다.</p>;
  }

  if (invitations.length === 0) {
    return <EmptyState title="받은 학원 초대장이 없습니다." description="학원에서 보낸 초대장이 있으면 이곳에 표시됩니다." />;
  }

  return (
    <div className="mt-5 grid gap-4">
      {invitations.map((invitation) => (
        <div key={invitation.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{invitation.academyName} 초대</h3>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${invitation.status === "PENDING" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                  {invitation.status === "PENDING" ? "대기" : invitation.status}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
                {invitation.message || "학원 연결 초대장입니다."}
              </p>
              <p className="mt-4 text-xs font-semibold text-slate-500">
                받은 날짜 {new Intl.DateTimeFormat("ko-KR").format(new Date(invitation.createdAt))}
              </p>
            </div>

            {invitation.status === "PENDING" ? (
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={processingId === invitation.id}
                  onClick={() => void onProcess(invitation.id, "accept")}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:bg-slate-400"
                >
                  수락
                </button>
                <button
                  type="button"
                  disabled={processingId === invitation.id}
                  onClick={() => void onProcess(invitation.id, "reject")}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-700 disabled:text-slate-400"
                >
                  거절
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

function RelationsPanel({
  config,
  state,
}: {
  config: PageConfig;
  state: ReturnType<typeof useParentStudentState>;
}) {
  return (
    <FamilyCard>
      <h2 className="text-lg font-bold text-slate-950">{config.connectedTitle}</h2>
      {state.isLoading ? <p className="mt-5 text-sm font-semibold text-slate-600">연결 정보를 불러오고 있습니다.</p> : null}
      {!state.isLoading && state.relations.length === 0 ? (
        <EmptyState title={config.connectedEmptyTitle} description={config.connectedEmptyDescription} />
      ) : null}
      {state.relations.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {state.relations.map((relation) => (
            <div key={relation.relationId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-950">
                    {config.role === "PARENT" ? relation.studentName : relation.parentName}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {config.role === "PARENT" ? relation.studentEmail : relation.parentEmail}
                  </p>
                </div>
                <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  연결됨
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </FamilyCard>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <FamilyCard>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
    </FamilyCard>
  );
}

function TextField({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function FamilyCard({ children }: { children: ReactNode }) {
  return <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">{children}</section>;
}

function FamilyLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800"
    >
      {children}
    </Link>
  );
}

function FamilyButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800"
    >
      {children}
    </button>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center">
      <h3 className="text-lg font-bold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: ParentStudentInvitationStatus }) {
  const styles: Record<ParentStudentInvitationStatus, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    ACCEPTED: "bg-emerald-50 text-emerald-700",
    REJECTED: "bg-slate-100 text-slate-600",
    EXPIRED: "bg-red-50 text-red-700",
    CANCELED: "bg-slate-100 text-slate-600",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ring-black/5 ${styles[status]}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function AlertMessage({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-line rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
      {children}
    </p>
  );
}

function SuccessMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
      {children}
    </p>
  );
}

function getInvitationTitle(config: PageConfig, invitation: ParentStudentInvitationResponse) {
  if (invitation.direction === "SENT") {
    return config.role === "PARENT" ? "자녀 연결 요청" : "보호자 연결 요청";
  }

  return invitation.requesterRole === "PARENT" ? "자녀 연결 요청" : "보호자 연결 요청";
}

function getStatusLabel(status: ParentStudentInvitationStatus) {
  const labels: Record<ParentStudentInvitationStatus, string> = {
    PENDING: "대기",
    ACCEPTED: "수락",
    REJECTED: "거절",
    EXPIRED: "만료",
    CANCELED: "취소",
  };

  return labels[status];
}

function getFamilyErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "연결 초대 정보를 처리하지 못했습니다.\n잠시 후 다시 시도해 주세요.";
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
