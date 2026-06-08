"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ApiError,
  approveAcademyConsultationRequest,
  completeAcademyConsultationRequest,
  getAcademyConsultationRequests,
  rejectAcademyConsultationRequest,
} from "@/lib/api";
import {
  consultationStatusLabels,
  consultationStatusStyles,
  type ConsultationRequestResponse,
  type ConsultationStatus,
} from "@/types/consultation";

type ConsultationRequestPanelProps = {
  onClose: () => void;
};

type StatusFilter = "ALL" | "REQUESTED" | "APPROVED" | "COMPLETED";
type ViewMode = "LIST" | "CALENDAR";

const statusFilters: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "전체" },
  { value: "REQUESTED", label: "요청됨" },
  { value: "APPROVED", label: "승인됨" },
  { value: "COMPLETED", label: "완료됨" },
];

export function ConsultationRequestPanel({ onClose }: ConsultationRequestPanelProps) {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const loadRequests = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await getAcademyConsultationRequests(accessToken);
      setRequests(response);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "상담 요청을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void Promise.resolve().then(() => loadRequests());
  }, [loadRequests]);

  const filteredRequests = useMemo(() => {
    const filtered = statusFilter === "ALL" ? requests : requests.filter((request) => request.status === statusFilter);
    return [...filtered].sort(compareConsultationTime);
  }, [requests, statusFilter]);

  const selectedDateRequests = useMemo(
    () => filteredRequests.filter((request) => request.requestedDate === selectedDate),
    [filteredRequests, selectedDate],
  );

  const processRequest = async (requestId: number, action: "approve" | "reject" | "complete") => {
    if (!accessToken) {
      return;
    }

    setProcessingId(requestId);
    setErrorMessage("");
    try {
      if (action === "approve") {
        await approveAcademyConsultationRequest(requestId, accessToken, "확인했습니다.");
      } else if (action === "reject") {
        await rejectAcademyConsultationRequest(requestId, accessToken, "일정 확인 후 거절했습니다.");
      } else {
        await completeAcademyConsultationRequest(requestId, accessToken, "상담을 완료했습니다.");
      }
      await loadRequests();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "상담 요청 상태를 변경하지 못했습니다.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
      <section className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">재원생 상담 요청</h2>
              <p className="mt-1 text-sm text-slate-600">학부모가 요청한 재원생 상담을 확인하고 예약 상태로 관리합니다.</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Link
                href="/academy/settings"
                onClick={onClose}
                className="inline-flex h-10 items-center justify-center rounded-2xl bg-blue-700 px-3 text-sm font-bold text-white transition hover:bg-blue-800"
              >
                상담 가능 시간 설정
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
                aria-label="상담 요청 패널 닫기"
              >
                x
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatusFilter(filter.value)}
                  className={`h-10 rounded-xl px-4 text-sm font-bold transition ${
                    statusFilter === filter.value ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            <div className="flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {([
                ["LIST", "목록"],
                ["CALENDAR", "달력"],
              ] as Array<[ViewMode, string]>).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`h-10 rounded-xl px-4 text-sm font-bold transition ${
                    viewMode === mode ? "bg-slate-900 text-white shadow-sm" : "text-slate-600 hover:bg-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5">
          {errorMessage ? (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              <p>{errorMessage}</p>
              <button type="button" onClick={loadRequests} className="mt-2 font-bold text-red-700 underline">
                다시 시도
              </button>
            </div>
          ) : null}
          {isLoading ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
              상담 요청을 불러오는 중입니다.
            </p>
          ) : viewMode === "CALENDAR" ? (
            <ConsultationCalendarView
              requests={filteredRequests}
              visibleMonth={visibleMonth}
              selectedDate={selectedDate}
              onMonthChange={setVisibleMonth}
              onDateSelect={setSelectedDate}
              selectedDateRequests={selectedDateRequests}
              processingId={processingId}
              onProcess={processRequest}
            />
          ) : filteredRequests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
              조건에 맞는 재원생 상담 요청이 없습니다.
            </p>
          ) : (
            filteredRequests.map((request) => (
              <ConsultationRequestCard
                key={request.consultationRequestId}
                request={request}
                processing={processingId === request.consultationRequestId}
                onProcess={processRequest}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function ConsultationCalendarView({
  requests,
  visibleMonth,
  selectedDate,
  onMonthChange,
  onDateSelect,
  selectedDateRequests,
  processingId,
  onProcess,
}: {
  requests: ConsultationRequestResponse[];
  visibleMonth: Date;
  selectedDate: string;
  onMonthChange: (date: Date) => void;
  onDateSelect: (dateKey: string) => void;
  selectedDateRequests: ConsultationRequestResponse[];
  processingId: number | null;
  onProcess: (requestId: number, action: "approve" | "reject" | "complete") => void;
}) {
  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);
  const requestCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    requests.forEach((request) => counts.set(request.requestedDate, (counts.get(request.requestedDate) ?? 0) + 1));
    return counts;
  }, [requests]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
      <section className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(visibleMonth, -1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-600 transition hover:bg-slate-50"
            aria-label="이전 월"
          >
            ‹
          </button>
          <h3 className="text-lg font-black text-slate-950">
            {visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월
          </h3>
          <button
            type="button"
            onClick={() => onMonthChange(addMonths(visibleMonth, 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-bold text-slate-600 transition hover:bg-slate-50"
            aria-label="다음 월"
          >
            ›
          </button>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <span key={day} className="py-2">
              {day}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const dateKey = toDateKey(day.date);
            const count = requestCountByDate.get(dateKey) ?? 0;
            const selected = selectedDate === dateKey;
            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => onDateSelect(dateKey)}
                className={`min-h-20 rounded-2xl border p-2 text-left transition ${
                  selected
                    ? "border-blue-300 bg-blue-700 text-white shadow-lg shadow-blue-100"
                    : day.inCurrentMonth
                      ? "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                      : "border-slate-100 bg-white/50 text-slate-300"
                }`}
              >
                <span className="text-sm font-black">{day.date.getDate()}</span>
                {count > 0 ? (
                  <span
                    className={`mt-2 flex w-fit rounded-full px-2 py-0.5 text-[11px] font-black ${
                      selected ? "bg-white text-blue-700" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    {count}건
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-4">
        <h3 className="font-black text-slate-950">{selectedDate} 상담 목록</h3>
        {selectedDateRequests.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
            선택한 날짜의 상담 요청이 없습니다.
          </p>
        ) : (
          <div className="mt-4 grid gap-3">
            {selectedDateRequests.map((request) => (
              <ConsultationRequestCard
                key={request.consultationRequestId}
                request={request}
                compact
                processing={processingId === request.consultationRequestId}
                onProcess={onProcess}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ConsultationRequestCard({
  request,
  processing,
  onProcess,
  compact = false,
}: {
  request: ConsultationRequestResponse;
  processing: boolean;
  onProcess: (requestId: number, action: "approve" | "reject" | "complete") => void;
  compact?: boolean;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
      <div className={`flex flex-col gap-4 ${compact ? "" : "lg:flex-row lg:items-start lg:justify-between"}`}>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{request.studentName}</h3>
            <ConsultationStatusBadge status={request.status} />
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <RequestField label="보호자 연락처" value={request.parentPhone || "연락처 없음"} />
            <RequestField
              label="상담 날짜/시간"
              value={`${request.requestedDate} ${normalizeTime(request.requestedStartTime)} - ${normalizeTime(request.requestedEndTime)}`}
            />
            <RequestField label="상담 주제" value={request.topicLabel} />
            <RequestField label="학원" value={request.academyName} />
            {request.teacherName ? <RequestField label="담당 선생님" value={request.teacherName} /> : null}
          </div>
          <p className="mt-4 whitespace-pre-line rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700">
            {request.content || "요청 내용이 없습니다."}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <RequestAction
            label="수락"
            onClick={() => onProcess(request.consultationRequestId, "approve")}
            disabled={processing || request.status === "APPROVED" || request.status === "COMPLETED"}
          />
          <RequestAction
            label="거절"
            onClick={() => onProcess(request.consultationRequestId, "reject")}
            disabled={processing || request.status === "REJECTED" || request.status === "COMPLETED"}
            subtle
          />
          <RequestAction
            label="완료 처리"
            onClick={() => onProcess(request.consultationRequestId, "complete")}
            disabled={processing || request.status === "COMPLETED"}
            done
          />
        </div>
      </div>
    </article>
  );
}

export function ConsultationStatusBadge({ status }: { status: ConsultationStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${consultationStatusStyles[status]}`}>
      {consultationStatusLabels[status]}
    </span>
  );
}

function RequestField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function RequestAction({
  label,
  onClick,
  disabled,
  subtle = false,
  done = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  subtle?: boolean;
  done?: boolean;
}) {
  const style = done
    ? "bg-emerald-600 text-white hover:bg-emerald-700"
    : subtle
      ? "border border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-700"
      : "bg-blue-700 text-white hover:bg-blue-800";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 ${style}`}
    >
      {label}
    </button>
  );
}

function compareConsultationTime(a: ConsultationRequestResponse, b: ConsultationRequestResponse) {
  if (a.requestedDate !== b.requestedDate) {
    return a.requestedDate.localeCompare(b.requestedDate);
  }
  return normalizeTime(a.requestedStartTime).localeCompare(normalizeTime(b.requestedStartTime));
}

function buildCalendarDays(visibleMonth: Date) {
  const firstDay = startOfMonth(visibleMonth);
  const firstCalendarDate = new Date(firstDay);
  firstCalendarDate.setDate(firstCalendarDate.getDate() - firstCalendarDate.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCalendarDate);
    date.setDate(firstCalendarDate.getDate() + index);
    return {
      date,
      inCurrentMonth: date.getMonth() === visibleMonth.getMonth(),
    };
  });
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
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
