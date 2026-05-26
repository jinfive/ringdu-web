"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  acceptParentStudentInvitation,
  ApiError,
  createParentStudentInvitation,
  createStudentParentInvitation,
  getParentInvitations,
  getParentStudents,
  getStudentInvitations,
  getStudentParents,
  rejectParentStudentInvitation,
} from "@/lib/api";
import type {
  ParentStudentInvitationResponse,
  ParentStudentInvitationStatus,
  ParentStudentRelationResponse,
} from "@/types/auth";

type FamilyRole = "PARENT" | "STUDENT";
type PageMode = "dashboard" | "invitations";

type PageConfig = {
  role: FamilyRole;
  homePath: string;
  invitationsPath: string;
  title: string;
  invitationTitle: string;
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
    title: "학부모 홈",
    invitationTitle: "자녀 연결",
    sendTitle: "자녀에게 연결 요청 보내기",
    managementTitle: "자녀 연결",
    managementDescription: "자녀와 연결하면 출석, 시간표, 청구 정보를 확인할 수 있습니다.",
    managementButtonLabel: "자녀 연결 관리",
    sentMessage: "자녀 연결 요청을 보냈습니다.",
    emailLabel: "학생 이메일",
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
    title: "학생 홈",
    invitationTitle: "보호자 연결",
    sendTitle: "보호자에게 연결 요청 보내기",
    managementTitle: "보호자 연결",
    managementDescription: "보호자와 연결하면 학원 생활 정보를 함께 확인할 수 있습니다.",
    managementButtonLabel: "보호자 연결 관리",
    sentMessage: "보호자 연결 요청을 보냈습니다.",
    emailLabel: "보호자 이메일",
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

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <InvitationForm config={config} state={state} compact />

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
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
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

export function ParentStudentInvitationsPage({ role }: { role: FamilyRole }) {
  const config = configs[role];
  const state = useParentStudentState(config);
  const received = state.invitations.filter((invitation) => invitation.direction === "RECEIVED");
  const sent = state.invitations.filter((invitation) => invitation.direction === "SENT");

  return (
    <FamilyShell config={config} mode="invitations">
      <div className="space-y-6">
        {state.errorMessage ? <AlertMessage>{state.errorMessage}</AlertMessage> : null}
        {state.successMessage ? <SuccessMessage>{state.successMessage}</SuccessMessage> : null}

        <InvitationForm config={config} state={state} />

        <section className="grid gap-6 xl:grid-cols-2">
          <FamilyCard>
            <h2 className="text-lg font-bold text-slate-950">받은 초대장</h2>
            <InvitationList
              config={config}
              invitations={received}
              isLoading={state.isLoading}
              processingId={state.processingId}
              onProcess={state.processInvitation}
              emptyTitle={config.receivedEmptyTitle}
            />
          </FamilyCard>

          <FamilyCard>
            <h2 className="text-lg font-bold text-slate-950">보낸 초대장</h2>
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
        </section>

        <RelationsPanel config={config} state={state} />
      </div>
    </FamilyShell>
  );
}

function useParentStudentState(config: PageConfig) {
  const { accessToken } = useAuth();
  const [invitations, setInvitations] = useState<ParentStudentInvitationResponse[]>([]);
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
      const [invitationResponses, relationResponses] = await Promise.all([
        config.role === "PARENT" ? getParentInvitations(accessToken) : getStudentInvitations(accessToken),
        config.role === "PARENT" ? getParentStudents(accessToken) : getStudentParents(accessToken),
      ]);
      setInvitations(invitationResponses);
      setRelations(relationResponses);
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
    ])
      .then(([invitationResponses, relationResponses]) => {
        if (isMounted) {
          setInvitations(invitationResponses);
          setRelations(relationResponses);
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
      return;
    }

    setIsSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (config.role === "PARENT") {
        await createParentStudentInvitation({ studentEmail: email, studentPhone: phone, message }, accessToken);
      } else {
        await createStudentParentInvitation({ parentEmail: email, parentPhone: phone, message }, accessToken);
      }
      setEmail("");
      setPhone("");
      setMessage(config.defaultMessage);
      setSuccessMessage(config.sentMessage);
      await load();
    } catch (error) {
      setErrorMessage(getFamilyErrorMessage(error));
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

  return {
    invitations,
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
  };
}

function FamilyShell({ config, mode, children }: { config: PageConfig; mode: PageMode; children: ReactNode }) {
  const { user, logout } = useAuth();
  const menu = [
    { href: config.homePath, label: config.title },
    { href: config.invitationsPath, label: config.invitationTitle },
  ];

  return (
    <RoleGuard allowedRole={config.role}>
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col lg:flex-row">
          <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white px-5 py-6 lg:block">
            <Link href="/" className="text-2xl font-bold tracking-tight text-blue-700">
              Ringdu
            </Link>
            <p className="mt-2 text-sm font-medium text-slate-500">{config.role === "PARENT" ? "학부모" : "학생"}</p>
            <nav className="mt-8 space-y-1">
              {menu.map((item) => (
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
                  <p className="mt-2 text-xs font-semibold uppercase text-blue-600 lg:mt-0">{config.role}</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-950">
                    {mode === "dashboard" ? config.title : config.invitationTitle}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-slate-600">{user?.name ?? "사용자"}님</span>
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
                {menu.map((item) => (
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

function InvitationForm({
  config,
  state,
  compact = false,
}: {
  config: PageConfig;
  state: ReturnType<typeof useParentStudentState>;
  compact?: boolean;
}) {
  return (
    <FamilyCard>
      <h2 className="text-lg font-bold text-slate-950">{config.sendTitle}</h2>
      <form className="mt-4 grid gap-4" onSubmit={state.submitInvitation}>
        <div className={`grid gap-4 ${compact ? "" : "md:grid-cols-2"}`}>
          <TextField label={config.emailLabel} value={state.email} onChange={state.setEmail} required />
          <TextField label={config.phoneLabel} value={state.phone} onChange={state.setPhone} required />
        </div>
        <label className="block">
          <span className="text-sm font-bold text-slate-700">초대 메시지</span>
          <textarea
            value={state.message}
            onChange={(event) => state.setMessage(event.target.value)}
            className="mt-2 min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={state.isSending}
            className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {state.isSending ? "전송 중" : "초대장 보내기"}
          </button>
        </div>
      </form>
    </FamilyCard>
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
        <div key={invitation.invitationId} className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-slate-950">{getInvitationTitle(config, invitation)}</h3>
                <StatusBadge status={invitation.status} />
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {invitation.direction === "SENT" ? invitation.receiverEmail : `${invitation.requesterName}님이 보냄`}
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
                  className="inline-flex h-10 items-center justify-center rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  수락
                </button>
                <button
                  type="button"
                  disabled={processingId === invitation.invitationId}
                  onClick={() => void onProcess(invitation.invitationId, "reject")}
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
            <div key={relation.relationId} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
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
        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function FamilyCard({ children }: { children: ReactNode }) {
  return <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">{children}</section>;
}

function FamilyLinkButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-10 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
    >
      {children}
    </Link>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
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
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
      {getStatusLabel(status)}
    </span>
  );
}

function AlertMessage({ children }: { children: ReactNode }) {
  return (
    <p className="whitespace-pre-line rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
      {children}
    </p>
  );
}

function SuccessMessage({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
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
