"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ApiError,
  createParentConsultationRequest,
  getAcademyPublicConsultationAvailability,
  getParentConsultationOptions,
  getParentConsultationRequests,
} from "@/lib/api";
import { ConsultationCalendar, toDateKey } from "./ConsultationCalendar";
import { ConsultationStatusBadge } from "./ConsultationRequestPanel";
import { ConsultationTimeSlots } from "./ConsultationTimeSlots";
import {
  consultationTopics,
  type ConsultationAvailabilityResponse,
  type ConsultationRequestResponse,
  type ConsultationTopic,
  type ParentConsultationOptionResponse,
} from "@/types/consultation";

export function ParentConsultationRequestPage() {
  const { accessToken } = useAuth();
  const [options, setOptions] = useState<ParentConsultationOptionResponse[]>([]);
  const [requests, setRequests] = useState<ConsultationRequestResponse[]>([]);
  const [availability, setAvailability] = useState<ConsultationAvailabilityResponse[]>([]);
  const [selectedOptionKey, setSelectedOptionKey] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
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
        setSelectedTeacherId(optionResponse[0].teachers[0]?.teacherUserId ? String(optionResponse[0].teachers[0].teacherUserId) : "");
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
    if (!accessToken || !selectedOption) {
      return;
    }

    void Promise.resolve().then(() => {
      setIsAvailabilityLoading(true);
      setSelectedSlotKey("");
      return getAcademyPublicConsultationAvailability(selectedOption.academyId, "ENROLLED_STUDENT", accessToken)
        .then(setAvailability)
        .catch((error) => setErrorMessage(error instanceof ApiError ? error.message : "상담 가능 시간을 불러오지 못했습니다."))
        .finally(() => setIsAvailabilityLoading(false));
    });
  }, [accessToken, selectedOption]);

  const availableSlots = useMemo(() => {
    const dayOfWeek = dayOfWeekFromDateKey(selectedDate);
    return availability
      .filter((slot) => slot.status === "ACTIVE" && slot.dayOfWeek === dayOfWeek)
      .map((slot) => ({
        key: `${slot.startTime}-${slot.endTime}`,
        label: `${normalizeTime(slot.startTime)} - ${normalizeTime(slot.endTime)}`,
        startTime: normalizeTime(slot.startTime),
        endTime: normalizeTime(slot.endTime),
      }));
  }, [availability, selectedDate]);

  const selectedSlot = availableSlots.find((slot) => slot.key === selectedSlotKey) ?? null;
  const selectedTeacher = selectedOption?.teachers.find((teacher) => String(teacher.teacherUserId) === selectedTeacherId) ?? null;
  const canSubmit = Boolean(selectedOption && topic && selectedDate && selectedSlot && message.trim());

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
          teacherUserId: selectedTeacherId ? Number(selectedTeacherId) : null,
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
            <SummaryItem label="담당 선생님" value={selectedTeacher?.teacherName ?? "미지정"} />
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
                      const nextOption = options.find((option) => optionKey(option) === nextKey);
                      setSelectedOptionKey(nextKey);
                      setSelectedTeacherId(nextOption?.teachers[0]?.teacherUserId ? String(nextOption.teachers[0].teacherUserId) : "");
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
              <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/80 p-4">
                <label className="block">
                  <span className="text-sm font-bold text-blue-700">담당 선생님</span>
                  <select
                    value={selectedTeacherId}
                    onChange={(event) => setSelectedTeacherId(event.target.value)}
                    className="mt-2 h-11 w-full rounded-2xl border border-blue-100 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">미지정</option>
                    {selectedOption?.teachers.map((teacher) => (
                      <option key={`${teacher.teacherUserId}-${teacher.classId}`} value={teacher.teacherUserId}>
                        {teacher.teacherName} · {teacher.className}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  수업: {selectedTeacher?.className ?? "담당 수업을 선택하지 않았습니다."}
                </p>
              </div>
            </ParentConsultationSection>

            <ParentConsultationSection title="날짜 선택">
              <ConsultationCalendar
                visibleMonth={visibleMonth}
                selectedDate={selectedDate}
                onMonthChange={setVisibleMonth}
                onDateSelect={setSelectedDate}
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
                {selectedDate} 학원이 등록한 상담 가능 시간 중 선택합니다.
              </p>
              {isAvailabilityLoading ? (
                <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
                  상담 가능 시간을 불러오는 중입니다.
                </p>
              ) : availableSlots.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 py-5 text-sm font-semibold text-slate-500">
                  선택한 날짜에 등록된 상담 가능 시간이 없습니다.
                </p>
              ) : (
                <ConsultationTimeSlots
                  slots={availableSlots.map((slot) => slot.label)}
                  disabledSlots={[]}
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

function dayOfWeekFromDateKey(dateKey: string) {
  const day = new Date(`${dateKey}T00:00:00`).getDay();
  return ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][day];
}

function normalizeTime(time: string) {
  return time.slice(0, 5);
}
