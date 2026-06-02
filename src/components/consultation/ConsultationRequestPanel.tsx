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

type ConsultationTab = "NEW_STUDENT" | "ENROLLED_STUDENT";

export function ConsultationRequestPanel({ onClose }: ConsultationRequestPanelProps) {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<ConsultationTab>("NEW_STUDENT");
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
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
      const response = await getAcademyConsultationRequests(accessToken, { type: "ENROLLED_STUDENT" });
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

  const filteredRequests = useMemo(() => (activeTab === "ENROLLED_STUDENT" ? requests : []), [activeTab, requests]);

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
      <section className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">상담 요청</h2>
              <p className="mt-1 text-sm text-slate-600">신규 상담 요청과 재원생 상담 요청을 확인합니다.</p>
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
          <div className="mt-4 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {([
              ["NEW_STUDENT", "신규 상담"],
              ["ENROLLED_STUDENT", "재원생 상담"],
            ] as Array<[ConsultationTab, string]>).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-10 flex-1 rounded-xl text-sm font-bold transition ${
                  activeTab === tab ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-white"
                }`}
              >
                {label}
              </button>
            ))}
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
          {activeTab === "NEW_STUDENT" ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
              신규생 비회원 상담 요청 API는 후속 작업에서 연결합니다.
            </p>
          ) : isLoading ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
              상담 요청을 불러오는 중입니다.
            </p>
          ) : filteredRequests.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
              재원생 상담 요청이 없습니다.
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

function ConsultationRequestCard({
  request,
  processing,
  onProcess,
}: {
  request: ConsultationRequestResponse;
  processing: boolean;
  onProcess: (requestId: number, action: "approve" | "reject" | "complete") => void;
}) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-950">{request.studentName}</h3>
            <ConsultationStatusBadge status={request.status} />
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <RequestField label="보호자 연락처" value="학부모 계정 연결" />
            <RequestField
              label="희망 날짜/시간"
              value={`${request.requestedDate} ${normalizeTime(request.requestedStartTime)} - ${normalizeTime(request.requestedEndTime)}`}
            />
            <RequestField label="상담 유형" value={request.topicLabel} />
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

function normalizeTime(time: string) {
  return time.slice(0, 5);
}
