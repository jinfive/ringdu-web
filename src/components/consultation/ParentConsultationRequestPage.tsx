"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ApiError,
  createParentConsultationRequest,
  getParentConsultationOptions,
  getParentConsultationRequests,
  getParentConsultantAvailability,
} from "@/lib/api";
import { ConsultationCalendar, toDateKey } from "./ConsultationCalendar";
import { ConsultationStatusBadge } from "./ConsultationRequestPanel";
import { ConsultationTimeSlots } from "./ConsultationTimeSlots";
import {
  consultationTopics,
  type ConsultationDateSlot,
  type ParentConsultationConsultantOption,
  type ConsultationRequestResponse,
  type ConsultationTopic,
  type ParentConsultationOptionResponse,
} from "@/types/consultation";

export function ParentConsultationRequestPage() {
  const { accessToken } = useAuth();
  const [options, setOptions] = useState<ParentConsultationOptionResponse[]>([]);
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
  const [availability, setAvailability] = useState<ConsultationDateSlot[]>([]);
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [selectedConsultantKey, setSelectedConsultantKey] = useState("");
  const [topic, setTopic] = useState<ConsultationTopic>("STUDY");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [selectedSlotKey, setSelectedSlotKey] = useState("");
  const [message, setMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadParentData = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [optionResponse, requestResponse] = await Promise.all([
        getParentConsultationOptions(accessToken),
        getParentConsultationRequests(accessToken),
      ]);
      setOptions(optionResponse);
      setRequests(requestResponse);
      if (!selectedOptionKey && optionResponse.length > 0) {
        setSelectedOptionKey(optionKey(optionResponse[0]));
        const firstAvailableConsultant = optionResponse[0].consultants.find((consultant) => consultant.available);
        setSelectedConsultantKey(firstAvailableConsultant ? consultantKey(firstAvailableConsultant) : "");
      }
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "상담 요청 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, selectedOptionKey]);

  useEffect(() => {
    void Promise.resolve().then(() => loadParentData());
  }, [loadParentData]);

  const selectedOption = options.find((option) => optionKey(option) === selectedOptionKey) ?? null;

  useEffect(() => {
    if (!accessToken || !selectedOption || !selectedConsultantKey) {
      return;
    }

    const consultant = selectedOption.consultants.find((item) => consultantKey(item) === selectedConsultantKey);
    if (!consultant) return;

    void Promise.resolve().then(() => {
      setIsAvailabilityLoading(true);
      setSelectedSlotKey("");
      return getParentConsultantAvailability(
        selectedOption.academyId,
        consultant.consultantType,
        consultant.teacherUserId ?? null,
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + 1,
        accessToken,
      )
        .then((response) => {
          setAvailability(response);
          const firstAvailableDate = response.find((date) => date.slots.some((slot) => slot.available))?.date;
          setSelectedDate((current) => (
            firstAvailableDate && !response.some((date) => date.date === current) ? firstAvailableDate : current
          ));
        })
        .catch((error) => setErrorMessage(error instanceof ApiError ? error.message : "상담 가능 시간을 불러오지 못했습니다."))
        .finally(() => setIsAvailabilityLoading(false));
    });
  }, [accessToken, selectedConsultantKey, selectedOption, visibleMonth]);

  const availableSlots = useMemo(() => {
    return (availability.find((date) => date.date === selectedDate)?.slots ?? []).map((slot) => ({
      ...slot,
      key: `${slot.startTime}-${slot.endTime}`,
      label: `${normalizeTime(slot.startTime)} - ${normalizeTime(slot.endTime)}`,
      startTime: normalizeTime(slot.startTime),
      endTime: normalizeTime(slot.endTime),
    }));
  }, [availability, selectedDate]);

  const selectedSlot = availableSlots.find((slot) => slot.key === selectedSlotKey) ?? null;
  const selectedConsultant = selectedOption?.consultants.find((consultant) => consultantKey(consultant) === selectedConsultantKey) ?? null;
  const canSubmit = Boolean(selectedOption && selectedConsultant && topic && selectedDate && selectedSlot?.available && message.trim());

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken || !selectedOption || !selectedSlot || !canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await createParentConsultationRequest(
        {
          academyId: selectedOption.academyId,
          studentProfileId: selectedOption.studentProfileId,
          consultantType: selectedConsultant!.consultantType,
          teacherUserId: selectedConsultant!.teacherUserId ?? null,
          requestedDate: selectedDate,
          requestedStartTime: selectedSlot.startTime,
          requestedEndTime: selectedSlot.endTime,
          topic,
          content: message.trim(),
        },
        accessToken,
      );
      setIsCompleted(true);
      setMessage("");
      await loadParentData();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "상담 요청을 접수하지 못했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted && selectedOption && selectedSlot) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-7 text-center shadow-xl shadow-emerald-100/60">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            요청 완료
          </span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">상담 요청이 접수되었습니다.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">학원 승인 후 일정이 확정됩니다.</p>
          <button
            type="button"
            onClick={() => setIsCompleted(false)}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-emerald-700 px-4 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            다른 상담 요청하기
          </button>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryItem label="자녀" value={selectedOption.studentName} />
            <SummaryItem label="학원" value={selectedOption.academyName} />
            <SummaryItem label="상담 담당" value={selectedConsultant?.consultantName ?? "미지정"} />
            <SummaryItem label="일정" value={`${selectedDate} ${selectedSlot.label}`} />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <p className="rounded-3xl border border-white/80 bg-white/95 p-6 text-sm font-semibold text-slate-500 shadow-xl shadow-slate-200/60">
        상담 요청 정보를 불러오는 중입니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <p>{errorMessage}</p>
          <button type="button" onClick={loadParentData} className="mt-2 font-bold text-red-700 underline">
            다시 시도
          </button>
        </div>
      ) : null}

      {options.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm font-semibold text-slate-500">
          연결된 재원생 정보가 없습니다.
        </p>
      ) : (
        <form className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)]" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <ParentConsultationSection title="자녀와 학원">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">자녀 선택</span>
                  <select
                    value={selectedOptionKey}
                    onChange={(event) => {
                      const nextKey = event.target.value;
                      setSelectedOptionKey(nextKey);
                      setAvailability([]);
                      const nextOption = options.find((option) => optionKey(option) === nextKey);
                      const firstAvailable = nextOption?.consultants.find((consultant) => consultant.available);
                      setSelectedConsultantKey(firstAvailable ? consultantKey(firstAvailable) : "");
                    }}
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {options.map((option) => (
                      <option key={optionKey(option)} value={optionKey(option)}>
                        {option.studentName} · {option.academyName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">학원 선택</span>
                  <select
                    value={selectedOption?.academyName ?? ""}
                    disabled
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700"
                  >
                    <option>{selectedOption?.academyName ?? "학원 없음"}</option>
                  </select>
                </label>
              </div>
              <div className="mt-4 border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-700">상담 담당</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {selectedOption?.consultants.map((consultant) => {
                    const selected = selectedConsultantKey === consultantKey(consultant);
                    return (
                      <button
                        key={consultantKey(consultant)}
                        type="button"
                        disabled={!consultant.available}
                        onClick={() => setSelectedConsultantKey(consultantKey(consultant))}
                        className={`p-4 text-left transition ${
                          selected
                            ? "border-2 border-blue-600 bg-white shadow-md"
                            : consultant.available
                              ? "border border-blue-100 bg-white hover:border-blue-300"
                              : "cursor-not-allowed border border-slate-200 bg-slate-100 opacity-60"
                        }`}
                      >
                        <span className="font-bold text-slate-950">{consultant.consultantName}</span>
                        <span className="mt-2 block text-sm text-slate-600">{consultant.description}</span>
                        <span className={`mt-3 inline-flex text-xs font-bold ${consultant.available ? "text-emerald-700" : "text-slate-500"}`}>
                          {consultant.available ? "상담 가능" : "등록된 시간이 없습니다"}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {selectedOption?.consultants.every((consultant) => consultant.consultantType !== "TEACHER") ? (
                  <p className="mt-3 text-sm font-semibold text-slate-500">수강 중인 수업의 담당 선생님이 없습니다.</p>
                ) : null}
              </div>
            </ParentConsultationSection>

            <ParentConsultationSection title="날짜 선택">
              <ConsultationCalendar
                visibleMonth={visibleMonth}
                selectedDate={selectedDate}
                onMonthChange={setVisibleMonth}
                onDateSelect={setSelectedDate}
                availableDates={availability.filter((date) => date.slots.some((slot) => slot.available)).map((date) => date.date)}
              />
            </ParentConsultationSection>
          </div>

          <aside className="space-y-6">
            <ParentConsultationSection title="상담 주제">
              <select
                value={topic}
                onChange={(event) => setTopic(event.target.value as ConsultationTopic)}
                className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {consultationTopics.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </ParentConsultationSection>

            <ParentConsultationSection title="시간 선택">
              <p className="mb-3 text-sm font-semibold text-slate-600">
                {selectedDate} {selectedConsultant?.consultantName ?? "담당자"} 상담 가능 시간입니다.
              </p>
              {isAvailabilityLoading ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                  상담 가능 시간을 불러오는 중입니다.
                </p>
              ) : !selectedConsultant ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm font-semibold text-slate-500">
                  상담 담당자를 먼저 선택해 주세요.
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm font-semibold text-slate-500">
                  선택한 날짜에 등록된 상담 가능 시간이 없습니다.
                </p>
              ) : (
                <ConsultationTimeSlots
                  slots={availableSlots.map((slot) => slot.label)}
                  disabledSlots={availableSlots.filter((slot) => !slot.available).map((slot) => slot.label)}
                  disabledReasons={Object.fromEntries(
                    availableSlots
                      .filter((slot) => !slot.available && slot.disabledReason)
                      .map((slot) => [slot.label, slot.disabledReason ?? "선택할 수 없습니다."]),
                  )}
                  selectedTime={availableSlots.find((slot) => slot.key === selectedSlotKey)?.label ?? ""}
                  onTimeSelect={(label) => setSelectedSlotKey(availableSlots.find((slot) => slot.label === label)?.key ?? "")}
                />
              )}
            </ParentConsultationSection>

            <ParentConsultationSection title="요청 내용">
              <textarea
                value={message}
                required
                onChange={(event) => setMessage(event.target.value)}
                placeholder="상담하고 싶은 내용을 입력해 주세요."
                className="min-h-32 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                {isSubmitting ? "요청 중" : "상담 요청하기"}
              </button>
            </ParentConsultationSection>
          </aside>
        </form>
      )}

      <ParentConsultationSection title="내 상담 요청">
        {requests.length === 0 ? (
          <p className="text-sm font-semibold text-slate-500">접수된 상담 요청이 없습니다.</p>
        ) : (
          <div className="grid gap-3">
            {requests.map((request) => (
              <article key={request.consultationRequestId} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-950">
                      {request.studentName} · {request.topicLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {request.requestedDate} {normalizeTime(request.requestedStartTime)} - {normalizeTime(request.requestedEndTime)}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">상담 담당: {request.consultantName}</p>
                  </div>
                  <ConsultationStatusBadge status={request.status} />
                </div>
              </article>
            ))}
          </div>
        )}
      </ParentConsultationSection>
    </div>
  );
}

function ParentConsultationSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
      <h2 className="mb-4 text-lg font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function optionKey(option: ParentConsultationOptionResponse) {
  return `${option.studentProfileId}:${option.academyId}`;
}

function consultantKey(consultant: ParentConsultationConsultantOption) {
  return consultant.consultantType === "ACADEMY_ACCOUNT"
    ? "ACADEMY_ACCOUNT"
    : `TEACHER:${consultant.teacherUserId}`;
}

function normalizeTime(time: string) {
  return time.slice(0, 5);
}
