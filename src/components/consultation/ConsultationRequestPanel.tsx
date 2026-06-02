"use client";

import { useMemo, useState } from "react";
import {
  consultationStatusLabels,
  consultationStatusStyles,
  mockConsultationRequests,
  type ConsultationRequest,
  type ConsultationRequestType,
  type ConsultationStatus,
} from "@/types/consultation";

type ConsultationRequestPanelProps = {
  onClose: () => void;
};

type ConsultationTab = "신규 상담" | "재원생 상담";

export function ConsultationRequestPanel({ onClose }: ConsultationRequestPanelProps) {
  const [activeTab, setActiveTab] = useState<ConsultationTab>("신규 상담");
  const [requests, setRequests] = useState<ConsultationRequest[]>(mockConsultationRequests);
  const filteredRequests = useMemo(
    () => requests.filter((request) => request.type === activeTab),
    [activeTab, requests],
  );

  const updateStatus = (requestId: string, status: ConsultationStatus) => {
    setRequests((current) =>
      current.map((request) => (request.id === requestId ? { ...request, status } : request)),
    );
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
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
              aria-label="상담 요청 패널 닫기"
            >
              ×
            </button>
          </div>
          <div className="mt-4 flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {(["신규 상담", "재원생 상담"] as ConsultationTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-10 flex-1 rounded-xl text-sm font-bold transition ${
                  activeTab === tab ? "bg-blue-700 text-white shadow-sm" : "text-slate-600 hover:bg-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5">
          {filteredRequests.map((request) => (
            <ConsultationRequestCard key={request.id} request={request} onStatusChange={updateStatus} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ConsultationRequestCard({
  request,
  onStatusChange,
}: {
  request: ConsultationRequest;
  onStatusChange: (requestId: string, status: ConsultationStatus) => void;
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
            <RequestField label="보호자 연락처" value={request.guardianPhone} />
            <RequestField label="희망 날짜/시간" value={`${request.preferredDate} ${request.preferredTime}`} />
            <RequestField label="상담 유형" value={request.topic} />
            <RequestField label="학원" value={request.academyName} />
            {request.teacherName ? <RequestField label="담당 선생님" value={request.teacherName} /> : null}
            {request.className ? <RequestField label="수업" value={request.className} /> : null}
          </div>
          <p className="mt-4 whitespace-pre-line rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-slate-700">
            {request.message}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <RequestAction label="수락" onClick={() => onStatusChange(request.id, "APPROVED")} disabled={request.status === "APPROVED"} />
          <RequestAction label="거절" onClick={() => onStatusChange(request.id, "REJECTED")} disabled={request.status === "REJECTED"} subtle />
          <RequestAction label="완료 처리" onClick={() => onStatusChange(request.id, "COMPLETED")} disabled={request.status === "COMPLETED"} done />
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

export function filterConsultationRequests(requests: ConsultationRequest[], type: ConsultationRequestType) {
  return requests.filter((request) => request.type === type);
}
