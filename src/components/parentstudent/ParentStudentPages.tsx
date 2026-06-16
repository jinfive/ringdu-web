"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import { ParentConsultationRequestPage } from "@/components/consultation/ParentConsultationRequestPage";
import {
  acceptParentStudentInvitation,
  acceptStudentAcademyInvitation,
  getStudentAcademyInvitations,
  rejectStudentAcademyInvitation,
  ApiError,
  createParentStudentInvitation,
  createStudentParentInvitation,
  getParentChildAcademies,
  getParentChildAttendanceRecords,
  getParentChildBillingInvoices,
  getParentChildHomeworks,
  getParentInvitations,
  getParentStudents,
  getStudentAcademies,
  getStudentAttendanceRecords,
  getStudentBillingInvoices,
  getStudentHomeworks,
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
  type AttendanceAcademyOptionResponse,
  type AttendanceRecordListItem,
  type AttendanceStatus,
  type ParentChildAttendanceRecordResponse,
  type StudentAttendanceRecordResponse,
} from "@/types/attendance";
import {
  billingStatusLabels,
  billingStatusStyles,
  type BillingInquiryInvoice,
} from "@/types/billing";
import {
  homeworkStatusLabels,
  homeworkStatusStyles,
  type HomeworkInquiryItem,
  type HomeworkStudentStatus,
} from "@/types/homework";
import type {
  ParentStudentInvitationResponse,
  AcademyStudentInvitationResponse,
  ParentStudentInvitationStatus,
  ParentStudentRelationResponse,
} from "@/types/auth";

type FamilyRole = "PARENT" | "STUDENT";
type PageMode = "dashboard" | "invitations" | "attendance" | "consultations" | "billing" | "homework";
type InvitationTab = "connected" | "received" | "sent";

type PageConfig = {
  role: FamilyRole;
  homePath: string;
  invitationsPath: string;
  attendancePath: string;
  billingPath: string;
  homeworkPath: string;
  consultationPath: string;
  title: string;
  invitationTitle: string;
  attendanceTitle: string;
  billingTitle: string;
  homeworkTitle: string;
  consultationTitle: string;
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
    billingPath: "/parent/billing",
    homeworkPath: "/parent/homework",
    consultationPath: "/parent/consultations",
    title: "학부모 홈",
    invitationTitle: "자녀 연결",
    attendanceTitle: "자녀 출석 기록",
    billingTitle: "자녀 청구 내역",
    homeworkTitle: "자녀 숙제",
    consultationTitle: "자녀 상담 요청",
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
    billingPath: "/student/billing",
    homeworkPath: "/student/homework",
    consultationPath: "/student",
    title: "학생 홈",
    invitationTitle: "보호자 연결",
    attendanceTitle: "내 출석 기록",
    billingTitle: "내 청구 내역",
    homeworkTitle: "내 숙제",
    consultationTitle: "상담 요청",
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
        <HomeworkSummaryCard role={role} />
        <BillingSummaryCard role={role} />
        {role === "PARENT" ? <ParentConsultationSummaryCard /> : null}

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

function HomeworkSummaryCard({ role }: { role: FamilyRole }) {
  const href = role === "PARENT" ? "/parent/homework" : "/student/homework";
  return (
    <FamilyCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{role === "PARENT" ? "자녀 숙제" : "내 숙제"}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {role === "PARENT" ? "자녀의 숙제와 확인 상태를 확인합니다." : "수업별 숙제와 기한을 확인합니다."}
          </p>
        </div>
        <FamilyLinkButton href={href}>숙제 보기</FamilyLinkButton>
      </div>
    </FamilyCard>
  );
}

export function ParentStudentHomeworkPage({ role }: { role: FamilyRole }) {
  const config = configs[role];
  const { accessToken } = useAuth();
  const state = useParentStudentState(config);
  const childOptions = useMemo(() => role === "PARENT"
    ? state.relations
      .filter((relation) => relation.status === "ACTIVE")
      .map((relation) => ({
        id: String(relation.studentUserId),
        name: relation.studentName,
        profileIds: (relation.studentProfiles ?? []).map((profile) => profile.studentProfileId),
      }))
      .filter((child) => child.profileIds.length > 0)
    : [], [role, state.relations]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [statusFilter, setStatusFilter] = useState<HomeworkStudentStatus | "ALL">("ALL");
  const [items, setItems] = useState<HomeworkInquiryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const effectiveChildId = selectedChildId || childOptions[0]?.id || "";
  const profileIds = useMemo(
    () => childOptions.find((child) => child.id === effectiveChildId)?.profileIds ?? [],
    [childOptions, effectiveChildId],
  );

  useEffect(() => {
    if (!accessToken || role === "PARENT" && state.isLoading) return;
    if (role === "PARENT" && profileIds.length === 0) {
      void Promise.resolve().then(() => {
        setItems([]);
        setIsLoading(false);
      });
      return undefined;
    }
    let active = true;
    void Promise.resolve().then(async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const query = { status: statusFilter };
        const response = role === "PARENT"
          ? (await Promise.all(profileIds.map((profileId) => getParentChildHomeworks(profileId, query, accessToken)))).flat()
          : await getStudentHomeworks(query, accessToken);
        if (active) setItems(response.sort((a, b) => b.dueDate.localeCompare(a.dueDate)));
      } catch (error) {
        if (active) setErrorMessage(getFamilyErrorMessage(error));
      } finally {
        if (active) setIsLoading(false);
      }
    });
    return () => { active = false; };
  }, [accessToken, profileIds, role, state.isLoading, statusFilter]);

  return (
    <FamilyShell config={config} mode="homework">
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-black text-slate-950">{config.homeworkTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">수업별 숙제와 기한, 해옴 여부를 확인합니다.</p>
        </section>
        <FamilyCard>
          <div className="grid gap-4 sm:grid-cols-2">
            {role === "PARENT" ? <label><span className="text-sm font-bold text-slate-700">자녀</span><select value={effectiveChildId} onChange={(event) => setSelectedChildId(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold"><option value="">자녀 선택</option>{childOptions.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}</select></label> : null}
            <label><span className="text-sm font-bold text-slate-700">상태</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as HomeworkStudentStatus | "ALL")} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold"><option value="ALL">전체</option><option value="DONE">해옴</option><option value="NOT_DONE">안해옴</option></select></label>
          </div>
        </FamilyCard>
        {errorMessage ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{errorMessage}</p> : null}
        {isLoading ? <FamilyCard><p className="text-sm font-semibold text-slate-600">숙제를 불러오고 있습니다.</p></FamilyCard> : null}
        {!isLoading && items.length === 0 ? <FamilyCard><div className="py-8 text-center"><h3 className="font-bold text-slate-950">조회된 숙제가 없습니다.</h3><p className="mt-2 text-sm text-slate-600">선생님이 숙제를 등록하면 이곳에 표시됩니다.</p></div></FamilyCard> : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => <HomeworkInquiryCard key={item.homeworkStudentId} item={item} showStudent={role === "PARENT"} />)}
        </div>
      </div>
    </FamilyShell>
  );
}

function HomeworkInquiryCard({ item, showStudent }: { item: HomeworkInquiryItem; showStudent: boolean }) {
  return <FamilyCard><div className="flex flex-wrap items-start justify-between gap-3"><div>{showStudent ? <p className="text-xs font-bold text-blue-600">{item.studentName}</p> : null}<h3 className="mt-1 text-lg font-bold text-slate-950">{item.title}</h3><p className="mt-1 text-sm font-semibold text-slate-600">{item.className} · {item.academyName}</p></div><span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${homeworkStatusStyles[item.status]}`}>{homeworkStatusLabels[item.status]}</span></div><div className="mt-4 rounded-2xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-400">기한</p><p className="mt-1 font-bold text-slate-900">{item.dueDate}</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">{item.content}</p>{item.memo ? <p className="mt-3 text-sm font-semibold text-slate-500">메모: {item.memo}</p> : null}</div></FamilyCard>;
}

function BillingSummaryCard({ role }: { role: FamilyRole }) {
  const title = "청구 내역";
  const description = role === "PARENT"
    ? "자녀의 수강료 청구와 수납 상태를 확인합니다."
    : "내 수강료 청구와 수납 상태를 확인합니다.";
  const href = role === "PARENT" ? "/parent/billing" : "/student/billing";

  return (
    <FamilyCard>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
        </div>
        <FamilyLinkButton href={href}>청구 내역 보기</FamilyLinkButton>
      </div>
    </FamilyCard>
  );
}

function ParentConsultationSummaryCard() {
  return (
    <FamilyCard>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">상담 요청</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">자녀의 상담 일정을 요청합니다.</p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-100">
          mock
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-600">자녀와 일정을 선택해 상담을 요청합니다.</p>
        <FamilyLinkButton href="/parent/consultations">상담 요청하기</FamilyLinkButton>
      </div>
    </FamilyCard>
  );
}

export function ParentStudentBillingPage({ role }: { role: FamilyRole }) {
  const config = configs[role];
  const { accessToken } = useAuth();
  const state = useParentStudentState(config);
  const currentYear = new Date().getFullYear();
  const billingChildOptions = useMemo(() => role === "PARENT"
    ? state.relations
      .filter((relation) => relation.status === "ACTIVE")
      .map((relation) => ({
        id: String(relation.studentUserId),
        name: relation.studentName,
        profileIds: (relation.studentProfiles ?? []).map((profile) => profile.studentProfileId),
      }))
      .filter((child) => child.profileIds.length > 0)
    : [], [role, state.relations]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedAcademyId, setSelectedAcademyId] = useState("all");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [invoices, setInvoices] = useState<BillingInquiryInvoice[]>([]);
  const [isBillingLoading, setIsBillingLoading] = useState(role === "STUDENT");
  const [billingErrorMessage, setBillingErrorMessage] = useState("");
  const effectiveStudentId = selectedStudentId || billingChildOptions[0]?.id || "";
  const selectedProfileIds = useMemo(
    () => billingChildOptions.find((child) => child.id === effectiveStudentId)?.profileIds ?? [],
    [billingChildOptions, effectiveStudentId],
  );

  useEffect(() => {
    if (!accessToken || (role === "PARENT" && state.isLoading)) return;
    if (role === "PARENT" && selectedProfileIds.length === 0) return;

    let active = true;
    void Promise.resolve().then(async () => {
      if (!active) return;
      setIsBillingLoading(true);
      setBillingErrorMessage("");
      try {
        const response = role === "PARENT"
          ? (await Promise.all(
              selectedProfileIds.map((profileId) => getParentChildBillingInvoices(profileId, selectedYear, accessToken)),
            )).flat()
          : await getStudentBillingInvoices(selectedYear, accessToken);
        if (active) setInvoices(response);
      } catch (error) {
        if (active) setBillingErrorMessage(getFamilyErrorMessage(error));
      } finally {
        if (active) setIsBillingLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [accessToken, role, selectedProfileIds, selectedYear, state.isLoading]);

  const academyOptions = useMemo(() => Array.from(
    new Map(invoices.map((invoice) => [invoice.academyId, invoice.academyName])).entries(),
  ).map(([id, name]) => ({ id: String(id), name })), [invoices]);
  const filteredInvoices = useMemo(() => selectedAcademyId === "all"
    ? invoices
    : invoices.filter((invoice) => String(invoice.academyId) === selectedAcademyId), [invoices, selectedAcademyId]);
  const activeInvoices = filteredInvoices.filter((invoice) => invoice.status !== "CANCELED");
  const summary = {
    amount: activeInvoices.reduce((total, invoice) => total + invoice.amount, 0),
    paidAmount: activeInvoices.reduce((total, invoice) => total + invoice.paidAmount, 0),
    unpaidAmount: activeInvoices.reduce((total, invoice) => total + invoice.unpaidAmount, 0),
    unpaidCount: activeInvoices.filter((invoice) => invoice.unpaidAmount > 0).length,
  };

  return (
    <FamilyShell config={config} mode="billing">
      <div className="space-y-6">
        {state.errorMessage ? <AlertMessage>{state.errorMessage}</AlertMessage> : null}
        {billingErrorMessage ? <AlertMessage>{billingErrorMessage}</AlertMessage> : null}

        <FamilyCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">청구 조회</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">학원에서 생성한 청구와 수납 상태를 조회합니다.</p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
              조회 전용
            </span>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {role === "PARENT" ? (
              <BillingFilter label="자녀 선택">
                <select value={effectiveStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} className={familySelectClass}>
                  {billingChildOptions.length === 0 ? <option value="">연결된 자녀 없음</option> : null}
                  {billingChildOptions.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
                </select>
              </BillingFilter>
            ) : null}
            <BillingFilter label="학원">
              <select value={selectedAcademyId} onChange={(event) => setSelectedAcademyId(event.target.value)} className={familySelectClass}>
                <option value="all">전체 학원</option>
                {academyOptions.map((academy) => <option key={academy.id} value={academy.id}>{academy.name}</option>)}
              </select>
            </BillingFilter>
            <BillingFilter label="년도">
              <select value={selectedYear} onChange={(event) => setSelectedYear(Number(event.target.value))} className={familySelectClass}>
                {Array.from({ length: 5 }, (_, index) => currentYear + 1 - index).map((year) => (
                  <option key={year} value={year}>{year}년</option>
                ))}
              </select>
            </BillingFilter>
          </div>
        </FamilyCard>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <BillingSummaryValue label="총 청구 금액" value={formatBillingWon(summary.amount)} />
          <BillingSummaryValue label="수납 완료 금액" value={formatBillingWon(summary.paidAmount)} />
          <BillingSummaryValue label="미납 금액" value={formatBillingWon(summary.unpaidAmount)} emphasis />
          <BillingSummaryValue label="미납 건수" value={`${summary.unpaidCount}건`} emphasis={summary.unpaidCount > 0} />
        </section>

        <FamilyCard>
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-950">청구 내역</h2>
              <p className="mt-1 text-sm text-slate-600">금액 수정이나 수납 처리는 학원에서만 할 수 있습니다.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{filteredInvoices.length}건</span>
          </div>
          {isBillingLoading ? (
            <p className="mt-5 text-sm font-semibold text-slate-500">청구 내역을 불러오고 있습니다.</p>
          ) : filteredInvoices.length === 0 ? (
            <EmptyState title="조회된 청구 내역이 없습니다." description="학원에서 청구서를 생성하면 이곳에 표시됩니다." />
          ) : (
            <div className="mt-5 grid gap-4">
              {filteredInvoices.map((invoice) => <BillingInquiryCard key={invoice.billingId} invoice={invoice} />)}
            </div>
          )}
        </FamilyCard>
      </div>
    </FamilyShell>
  );
}

function BillingInquiryCard({ invoice }: { invoice: BillingInquiryInvoice }) {
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <h3 className="break-words font-bold text-slate-950">{invoice.billingTitle}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">{invoice.studentName} · {invoice.academyName}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${billingStatusStyles[invoice.status]}`}>
          {billingStatusLabels[invoice.status]}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4 sm:grid-cols-4 sm:px-5">
        <BillingInvoiceValue label="청구 기간" value={formatBillingPeriod(invoice)} />
        <BillingInvoiceValue label="납부 기준일" value={invoice.dueDate} />
        <BillingInvoiceValue label="청구 금액" value={formatBillingWon(invoice.amount)} />
        <BillingInvoiceValue label="수납 금액" value={formatBillingWon(invoice.paidAmount)} />
        <BillingInvoiceValue label="미납 금액" value={formatBillingWon(invoice.unpaidAmount)} emphasis={invoice.unpaidAmount > 0} />
        {invoice.memo ? <div className="col-span-2 sm:col-span-3"><BillingInvoiceValue label="메모" value={invoice.memo} /></div> : null}
      </div>
    </article>
  );
}

function BillingFilter({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="text-sm font-bold text-slate-700">{label}</span><div className="mt-2">{children}</div></label>;
}

function BillingSummaryValue({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
      <p className="text-sm font-bold text-slate-500">{label}</p>
      <p className={`mt-2 text-xl font-black ${emphasis ? "text-red-600" : "text-slate-950"}`}>{value}</p>
    </div>
  );
}

function BillingInvoiceValue({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return <div className="min-w-0"><p className="text-xs font-bold text-slate-400">{label}</p><p className={`mt-1 break-words text-sm font-bold ${emphasis ? "text-red-600" : "text-slate-900"}`}>{value}</p></div>;
}

export function ParentStudentAttendancePage({ role }: { role: FamilyRole }) {
  const config = configs[role];
  const { accessToken } = useAuth();
  const state = useParentStudentState(config);
  const defaultFilter = getCurrentAttendanceFilter();
  const [selectedYear, setSelectedYear] = useState(defaultFilter.year);
  const [selectedMonth, setSelectedMonth] = useState(defaultFilter.month);
  const [selectedAcademyId, setSelectedAcademyId] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState("all");
  const [records, setRecords] = useState<AttendanceRecordListItem[]>([]);
  const [academyOptions, setAcademyOptions] = useState<Array<{ id: string; name: string }>>([]);
  const [isAttendanceLoading, setIsAttendanceLoading] = useState(true);
  const [attendanceErrorMessage, setAttendanceErrorMessage] = useState("");
  const childOptions = useMemo(() => role === "PARENT" ? getChildOptions(state.relations) : [], [role, state.relations]);
  const selectedAcademyFilter = selectedAcademyId === "all" ? null : Number(selectedAcademyId);
  const selectedStudentProfileIds = useMemo(() => {
    if (role !== "PARENT") {
      return [];
    }
    if (selectedStudentId !== "all") {
      return [Number(selectedStudentId)];
    }
    return childOptions.map((child) => Number(child.id));
  }, [childOptions, role, selectedStudentId]);

  const loadAttendance = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    if (role === "PARENT" && state.isLoading) {
      return;
    }

    setIsAttendanceLoading(true);
    setAttendanceErrorMessage("");

    try {
      if (role === "STUDENT") {
        const [academyResponses, recordResponses] = await Promise.all([
          getStudentAcademies(accessToken),
          getStudentAttendanceRecords(
            { academyId: selectedAcademyFilter, year: selectedYear, month: selectedMonth },
            accessToken,
          ),
        ]);
        setAcademyOptions(toAcademyOptions(academyResponses));
        setRecords(recordResponses.map(toStudentAttendanceItem));
      } else {
        if (selectedStudentProfileIds.length === 0) {
          setAcademyOptions([]);
          setRecords([]);
          return;
        }
        const [academyResponseGroups, recordResponseGroups] = await Promise.all([
          Promise.all(selectedStudentProfileIds.map((studentProfileId) => getParentChildAcademies(studentProfileId, accessToken))),
          Promise.all(
            selectedStudentProfileIds.map((studentProfileId) =>
              getParentChildAttendanceRecords(
                studentProfileId,
                { academyId: selectedAcademyFilter, year: selectedYear, month: selectedMonth },
                accessToken,
              ),
            ),
          ),
        ]);
        setAcademyOptions(toAcademyOptions(academyResponseGroups.flat()));
        setRecords(recordResponseGroups.flat().map(toParentAttendanceItem));
      }
    } catch (error) {
      setAttendanceErrorMessage(getFamilyErrorMessage(error));
    } finally {
      setIsAttendanceLoading(false);
    }
  }, [
    accessToken,
    role,
    selectedAcademyFilter,
    selectedMonth,
    selectedStudentProfileIds,
    selectedYear,
    state.isLoading,
  ]);

  useEffect(() => {
    void Promise.resolve().then(loadAttendance);
  }, [loadAttendance]);

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
            <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
              조회 전용
            </span>
          </div>
        </FamilyCard>

        {attendanceErrorMessage ? (
          <FamilyCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <AlertMessage>{attendanceErrorMessage}</AlertMessage>
              <FamilyButton onClick={() => void loadAttendance()}>다시 시도</FamilyButton>
            </div>
          </FamilyCard>
        ) : null}

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

        <FamilyAttendanceRecords role={role} records={records} isLoading={isAttendanceLoading} />
      </div>
    </FamilyShell>
  );
}

export function ParentConsultationsPage() {
  const config = configs.PARENT;

  return (
    <FamilyShell config={config} mode="consultations">
      <div className="space-y-6">
        <FamilyCard>
          <h2 className="text-lg font-bold text-slate-950">자녀 상담 요청</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">상담할 자녀와 일정을 선택해 주세요.</p>
        </FamilyCard>
        <ParentConsultationRequestPage />
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

function FamilyAttendanceRecords({
  role,
  records,
  isLoading,
}: {
  role: FamilyRole;
  records: AttendanceRecordListItem[];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <FamilyCard>
        <EmptyState title="출석 기록을 불러오는 중입니다." description="선택한 조건에 맞는 출석 기록을 확인하고 있습니다." />
      </FamilyCard>
    );
  }

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

function getChildOptions(relations: ParentStudentRelationResponse[]) {
  return relations.flatMap((relation) => {
    const profileOptions = (relation.studentProfiles ?? []).map((profile) => ({
      id: String(profile.studentProfileId),
      name: profile.studentName || relation.studentName,
    }));

    if (profileOptions.length > 0) {
      return profileOptions;
    }

    if (relation.studentProfileId) {
      return [
        {
          id: String(relation.studentProfileId),
          name: relation.studentName,
        },
      ];
    }

    return [];
  });
}

function toAcademyOptions(academies: AttendanceAcademyOptionResponse[]) {
  return Array.from(
    new Map(
      academies.map((academy) => [
        String(academy.academyId),
        { id: String(academy.academyId), name: academy.academyName },
      ]),
    ).values(),
  );
}

function toStudentAttendanceItem(record: StudentAttendanceRecordResponse): AttendanceRecordListItem {
  return {
    id: `${record.attendanceDate}-${record.academyId}-${record.classId}-${record.status}`,
    attendanceDate: record.attendanceDate,
    academyId: String(record.academyId),
    academyName: record.academyName,
    className: record.className,
    status: record.status,
    memo: record.memo ?? "",
  };
}

function toParentAttendanceItem(record: ParentChildAttendanceRecordResponse): AttendanceRecordListItem {
  return {
    id: `${record.attendanceDate}-${record.studentProfileId}-${record.academyId}-${record.classId}-${record.status}`,
    attendanceDate: record.attendanceDate,
    studentId: String(record.studentProfileId),
    studentName: record.studentName,
    academyId: String(record.academyId),
    academyName: record.academyName,
    className: record.className,
    status: record.status,
    memo: record.memo ?? "",
  };
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
    { href: config.homeworkPath, label: config.homeworkTitle },
  ];
  const pageTitle =
    mode === "dashboard"
      ? config.title
      : mode === "invitations"
        ? config.invitationTitle
        : mode === "attendance"
          ? config.attendanceTitle
          : mode === "homework"
            ? config.homeworkTitle
            : mode === "billing"
            ? config.billingTitle
            : config.consultationTitle;

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

const familySelectClass = "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

function formatBillingWon(amount: number) {
  return `${Math.max(amount, 0).toLocaleString("ko-KR")}원`;
}

function formatBillingPeriod(invoice: BillingInquiryInvoice) {
  const formatMonth = (value: string) => {
    const [year, month] = value.split("-");
    return `${year}.${month}`;
  };
  const start = formatMonth(invoice.billingPeriodStartMonth);
  const end = formatMonth(invoice.billingPeriodEndMonth);
  return start === end ? start : `${start} ~ ${end}`;
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
