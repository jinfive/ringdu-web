"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { AcademyCard, AcademyLinkButton, AcademyShell, StatusBadge } from "@/components/academy/AcademyShell";
import {
  ApiError,
  approveAcademyConsultationRequest,
  completeAcademyConsultationRequest,
  createAcademyStudentConsultationMemo,
  getAcademyStudentConsultationMemos,
  getAcademyConsultationRequests,
  rejectAcademyConsultationRequest,
} from "@/lib/api";
import {
  consultationStatusLabels,
  consultationStatusStyles,
  consultationTopicLabels,
  consultationMemoWriterRoleLabels,
  consultationMemoWriterRoleStyles,
  type ConsultationMemo,
  type ConsultationRequestResponse,
  type ConsultationStatus,
} from "@/types/consultation";

export type ConsultationMemoDraft = {
  content: string;
  nextAction: string;
};

type ConsultationAction = "approve" | "reject" | "complete";
type StatusFilter = "ALL" | ConsultationStatus;

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "REQUESTED", label: "요청됨" },
  { value: "APPROVED", label: "승인됨" },
];

export function AcademyConsultationCalendarPage() {
  const { accessToken } = useAuth();
  const initialMonth = getCurrentMonthFilter();
  const [selectedYear, setSelectedYear] = useState(initialMonth.year);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth.month);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ConsultationRequestResponse | null>(null);
  const [memoDrafts, setMemoDrafts] = useState<Record<number, ConsultationMemoDraft>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const monthRange = useMemo(() => getMonthRange(selectedYear, selectedMonth), [selectedMonth, selectedYear]);

  const loadRequests = useCallback(async () => {
    if (!accessToken) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await getAcademyConsultationRequests(accessToken, {
        from: monthRange.from,
        to: monthRange.to,
        status: statusFilter === "ALL" ? null : statusFilter,
        activeOnly: true,
      });
      setRequests(response);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "상담 예약을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, monthRange.from, monthRange.to, statusFilter]);

  useEffect(() => {
    void Promise.resolve().then(loadRequests);
  }, [loadRequests]);

  const selectedDateRequests = useMemo(
    () => requests.filter((request) => request.requestedDate === selectedDate).sort(compareConsultationTime),
    [requests, selectedDate],
  );

  const summary = useMemo(
    () => ({
      today: requests.filter((request) => request.requestedDate === toDateKey(new Date())).length,
      requested: requests.filter((request) => request.status === "REQUESTED").length,
      approved: requests.filter((request) => request.status === "APPROVED").length,
    }),
    [requests],
  );

  const processRequest = async (request: ConsultationRequestResponse, action: ConsultationAction) => {
    if (!accessToken) return;

    setProcessingId(request.consultationRequestId);
    setErrorMessage("");
    try {
      if (action === "approve") {
        await approveAcademyConsultationRequest(request.consultationRequestId, accessToken, "확인했습니다.");
      } else if (action === "reject") {
        await rejectAcademyConsultationRequest(request.consultationRequestId, accessToken, "일정 확인 후 거절했습니다.");
      } else {
        await completeAcademyConsultationRequest(request.consultationRequestId, accessToken, "상담을 완료했습니다.");
      }
      await loadRequests();
      setSelectedRequest((current) => (current?.consultationRequestId === request.consultationRequestId ? null : current));
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "상담 상태를 변경하지 못했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AcademyShell
      title="상담 예약 관리"
      description="재원생 상담 요청과 예정된 상담을 한 곳에서 확인합니다."
      actions={<AcademyLinkButton href="/academy/students">학생 관리로 이동</AcademyLinkButton>}
    >
      <div className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-3">
          <SummaryCard label="오늘 상담" value={`${summary.today}건`} />
          <SummaryCard label="요청 대기" value={`${summary.requested}건`} />
          <SummaryCard label="승인된 상담" value={`${summary.approved}건`} />
        </section>

        <AcademyCard>
          <div className="grid gap-3 md:grid-cols-3">
            <SelectField label="년도" value={selectedYear} onChange={(value) => setSelectedYear(Number(value))}>
              {getYearOptions().map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </SelectField>
            <SelectField label="월" value={selectedMonth} onChange={(value) => setSelectedMonth(Number(value))}>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
                <option key={month} value={month}>
                  {month}월
                </option>
              ))}
            </SelectField>
            <SelectField label="상태" value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)}>
              {statusFilters.map((filter) => (
                <option key={filter.value} value={filter.value}>
                  {filter.label}
                </option>
              ))}
            </SelectField>
          </div>
        </AcademyCard>

        {errorMessage ? (
          <AcademyCard>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
              <button
                type="button"
                onClick={loadRequests}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50"
              >
                다시 시도
              </button>
            </div>
          </AcademyCard>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <AcademyCard>
            <ConsultationMonthCalendar
              year={selectedYear}
              month={selectedMonth}
              requests={requests}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </AcademyCard>

          <AcademyCard>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">날짜별 상담 목록</h2>
                <p className="mt-1 text-sm font-semibold text-slate-500">{selectedDate}</p>
              </div>
              <StatusBadge>{selectedDateRequests.length}건</StatusBadge>
            </div>
            {isLoading ? (
              <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                상담 예약을 불러오고 있습니다.
              </p>
            ) : selectedDateRequests.length === 0 ? (
              <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                선택한 날짜의 상담 예약이 없습니다.
              </p>
            ) : (
              <ConsultationTimeline
                requests={selectedDateRequests}
                onSelect={setSelectedRequest}
                className="mt-5"
              />
            )}
          </AcademyCard>
        </div>

        <AcademyCard>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-950">월별 상담 전체 목록</h2>
              <p className="mt-1 text-sm text-slate-600">상담 카드를 클릭하면 상세와 메모 UI를 확인할 수 있습니다.</p>
            </div>
            <StatusBadge>{requests.length}건</StatusBadge>
          </div>
          {isLoading ? (
            <p className="mt-5 text-sm font-semibold text-slate-600">상담 목록을 불러오고 있습니다.</p>
          ) : requests.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
              선택한 기간의 상담 예약이 없습니다.
            </p>
          ) : (
            <ConsultationTimeline requests={[...requests].sort(compareConsultationTime)} onSelect={setSelectedRequest} className="mt-5" />
          )}
        </AcademyCard>
      </div>

      {selectedRequest ? (
        <ConsultationDetailModal
          request={selectedRequest}
          memoDraft={memoDrafts[selectedRequest.consultationRequestId]}
          processing={processingId === selectedRequest.consultationRequestId}
          onClose={() => setSelectedRequest(null)}
          onProcess={processRequest}
          onMemoSave={(requestId, memo) => setMemoDrafts((current) => ({ ...current, [requestId]: memo }))}
        />
      ) : null}
    </AcademyShell>
  );
}

export function ConsultationTimeline({
  requests,
  onSelect,
  className = "",
}: {
  requests: ConsultationRequestResponse[];
  onSelect: (request: ConsultationRequestResponse) => void;
  className?: string;
}) {
  return (
    <div className={`grid gap-3 ${className}`}>
      {requests.map((request) => (
        <button
          key={request.consultationRequestId}
          type="button"
          onClick={() => onSelect(request)}
          className="w-full rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/60 hover:shadow-xl hover:shadow-blue-100/50"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-black text-slate-950">
                  {formatDateTime(request.requestedDate, request.requestedStartTime, request.requestedEndTime)}
                </p>
                <ConsultationStatusBadge status={request.status} />
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-950">{request.topicLabel || consultationTopicLabels[request.topic]}</h3>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{request.content || "요청 내용이 없습니다."}</p>
            </div>
            <div className="grid shrink-0 gap-2 text-sm text-slate-600 sm:min-w-52">
              <span className="font-bold text-slate-900">{request.studentName}</span>
              <span>상담 담당: {request.consultantName}</span>
              <span>{request.parentPhone || "보호자 연락처 없음"}</span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

export function ConsultationDetailModal({
  request,
  memoDraft,
  processing,
  onClose,
  onProcess,
  onMemoSave,
}: {
  request: ConsultationRequestResponse;
  memoDraft?: ConsultationMemoDraft;
  processing: boolean;
  onClose: () => void;
  onProcess: (request: ConsultationRequestResponse, action: ConsultationAction) => void;
  onMemoSave: (requestId: number, memo: ConsultationMemoDraft) => void;
}) {
  const { accessToken } = useAuth();
  const [content, setContent] = useState(memoDraft?.content ?? request.academyMemo ?? "");
  const [nextAction, setNextAction] = useState(memoDraft?.nextAction ?? "");
  const [title, setTitle] = useState(request.topicLabel || consultationTopicLabels[request.topic]);
  const [memos, setMemos] = useState<ConsultationMemo[]>([]);
  const [isSavingMemo, setIsSavingMemo] = useState(false);
  const [memoErrorMessage, setMemoErrorMessage] = useState("");
  const isReadOnly = request.status === "REJECTED" || request.status === "CANCELED";

  useEffect(() => {
    if (!accessToken) return;

    let isMounted = true;
    void getAcademyStudentConsultationMemos(request.studentProfileId, accessToken)
      .then((responses) => {
        if (isMounted) {
          setMemos(responses.filter((memo) => memo.consultationRequestId === request.consultationRequestId));
        }
      })
      .catch((error) => {
        if (isMounted) {
          setMemoErrorMessage(error instanceof ApiError ? error.message : "상담 메모를 불러오지 못했습니다.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken, request.consultationRequestId, request.studentProfileId]);

  const saveMemo = async () => {
    if (!accessToken || !content.trim()) {
      setMemoErrorMessage("상담 내용을 입력해 주세요.");
      return;
    }

    setIsSavingMemo(true);
    setMemoErrorMessage("");
    try {
      const saved = await createAcademyStudentConsultationMemo(
        request.studentProfileId,
        {
          studentProfileId: request.studentProfileId,
          consultationRequestId: request.consultationRequestId,
          title: title.trim() || request.topicLabel || consultationTopicLabels[request.topic],
          content: content.trim(),
          nextAction: nextAction.trim() || null,
          consultationDate: request.requestedDate,
        },
        accessToken,
      );
      setMemos((current) => [saved, ...current]);
      onMemoSave(request.consultationRequestId, { content, nextAction });
    } catch (error) {
      setMemoErrorMessage(error instanceof ApiError ? error.message : "상담 메모를 저장하지 못했습니다.");
    } finally {
      setIsSavingMemo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
      <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">상담 상세</h2>
            <p className="mt-1 text-sm text-slate-600">{request.studentName} 학생 상담 요청</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
            aria-label="상담 상세 닫기"
          >
            x
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-950">{request.topicLabel || consultationTopicLabels[request.topic]}</h3>
              <ConsultationStatusBadge status={request.status} />
            </div>
            <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <DetailField label="학생명" value={request.studentName} />
              <DetailField label="상담 날짜/시간" value={formatDateTime(request.requestedDate, request.requestedStartTime, request.requestedEndTime)} />
              <DetailField label="상담 담당" value={request.consultantName} />
              <DetailField label="보호자 연락처" value={request.parentPhone || "연락처 없음"} />
              <DetailField label="학원" value={request.academyName} />
              <DetailField label="상태" value={request.statusLabel || consultationStatusLabels[request.status]} />
            </div>
            <div className="mt-5">
              <p className="text-xs font-bold text-slate-500">요청 내용</p>
              <p className="mt-2 whitespace-pre-line rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700">
                {request.content || "요청 내용이 없습니다."}
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">상담 메모</h3>
                <p className="mt-1 text-sm text-slate-600">상담 완료 전후로 상담 내용과 다음 조치를 기록합니다.</p>
              </div>
              <StatusBadge>{memos.length}건</StatusBadge>
            </div>
            {memoErrorMessage ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{memoErrorMessage}</p> : null}
            {memos.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {memos.map((memo) => (
                  <div key={memo.consultationMemoId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${consultationMemoWriterRoleStyles[memo.writerRole]}`}>
                        {consultationMemoWriterRoleLabels[memo.writerRole]}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{memo.writerName}</span>
                    </div>
                    <h4 className="mt-3 font-bold text-slate-950">{memo.title}</h4>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">{memo.content}</p>
                    {memo.nextAction ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">다음 조치: {memo.nextAction}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}
            <div className="mt-4 grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">제목</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={isReadOnly}
                  className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white disabled:text-slate-400"
                  placeholder="상담 제목"
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">상담 내용</span>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  disabled={isReadOnly}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white disabled:text-slate-400"
                  placeholder="상담에서 확인한 학습 상황과 보호자 의견을 기록합니다."
                />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">다음 조치</span>
                <textarea
                  value={nextAction}
                  onChange={(event) => setNextAction(event.target.value)}
                  disabled={isReadOnly}
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-300 focus:bg-white disabled:text-slate-400"
                  placeholder="추가 상담, 과제 점검, 진도 조정 등 다음 액션을 기록합니다."
                />
              </label>
              <button
                type="button"
                disabled={isReadOnly || isSavingMemo}
                onClick={() => void saveMemo()}
                className="inline-flex h-11 w-fit items-center justify-center rounded-2xl bg-slate-900 px-5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isSavingMemo ? "저장 중" : "메모 저장"}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {request.status === "REQUESTED" ? (
              <>
                <ActionButton label="수락" disabled={processing} onClick={() => onProcess(request, "approve")} />
                <ActionButton label="거절" disabled={processing} onClick={() => onProcess(request, "reject")} variant="danger" />
              </>
            ) : null}
            {request.status === "APPROVED" ? (
              <ActionButton label="완료 처리" disabled={processing} onClick={() => onProcess(request, "complete")} variant="done" />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function ConsultationMonthCalendar({
  year,
  month,
  requests,
  selectedDate,
  onSelectDate,
}: {
  year: number;
  month: number;
  requests: ConsultationRequestResponse[];
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
}) {
  const days = useMemo(() => buildCalendarDays(year, month), [month, year]);
  const countByDate = useMemo(() => {
    const counts = new Map<string, number>();
    requests.forEach((request) => counts.set(request.requestedDate, (counts.get(request.requestedDate) ?? 0) + 1));
    return counts;
  }, [requests]);

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-950">월간 상담 달력</h2>
          <p className="mt-1 text-sm text-slate-600">상담이 있는 날짜에는 건수가 표시됩니다.</p>
        </div>
        <StatusBadge>
          {year}.{String(month).padStart(2, "0")}
        </StatusBadge>
      </div>
      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
        {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <span key={day} className="py-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const dateKey = toDateKey(day.date);
          const count = countByDate.get(dateKey) ?? 0;
          const selected = selectedDate === dateKey;
          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              className={`min-h-16 rounded-2xl border p-2 text-left transition sm:min-h-20 ${
                selected
                  ? "border-blue-300 bg-blue-700 text-white shadow-lg shadow-blue-100"
                  : day.inCurrentMonth
                    ? "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                    : "border-slate-100 bg-white/50 text-slate-300"
              }`}
            >
              <span className="text-sm font-black">{day.date.getDate()}</span>
              {count > 0 ? (
                <span className={`mt-2 flex w-fit rounded-full px-2 py-0.5 text-[11px] font-black ${selected ? "bg-white text-blue-700" : "bg-blue-50 text-blue-700"}`}>
                  {count}건
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <AcademyCard>
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-black text-slate-950">{value}</p>
    </AcademyCard>
  );
}

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ActionButton({
  label,
  disabled,
  onClick,
  variant = "primary",
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "danger" | "done";
}) {
  const styles = {
    primary: "bg-blue-700 text-white hover:bg-blue-800",
    danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
    done: "bg-emerald-600 text-white hover:bg-emerald-700",
  };

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${styles[variant]}`}
    >
      {label}
    </button>
  );
}

export function ConsultationStatusBadge({ status }: { status: ConsultationStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${consultationStatusStyles[status]}`}>
      {consultationStatusLabels[status]}
    </span>
  );
}

export function getCurrentMonthFilter() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export function getMonthRange(year: number, month: number) {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const end = new Date(year, month, 0).getDate();
  return {
    from,
    to: `${year}-${String(month).padStart(2, "0")}-${String(end).padStart(2, "0")}`,
  };
}

export function getYearOptions() {
  const currentYear = new Date().getFullYear();
  return [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];
}

export function compareConsultationTime(a: ConsultationRequestResponse, b: ConsultationRequestResponse) {
  if (a.requestedDate !== b.requestedDate) {
    return a.requestedDate.localeCompare(b.requestedDate);
  }
  return normalizeTime(a.requestedStartTime).localeCompare(normalizeTime(b.requestedStartTime));
}

export function normalizeTime(time: string) {
  return time.slice(0, 5);
}

function formatDateTime(date: string, startTime: string, endTime: string) {
  return `${date.replaceAll("-", ".")} ${normalizeTime(startTime)} - ${normalizeTime(endTime)}`;
}

function buildCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month - 1, 1);
  const firstCalendarDate = new Date(firstDay);
  firstCalendarDate.setDate(firstCalendarDate.getDate() - firstCalendarDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCalendarDate);
    date.setDate(firstCalendarDate.getDate() + index);
    return {
      date,
      inCurrentMonth: date.getMonth() === month - 1,
    };
  });
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
