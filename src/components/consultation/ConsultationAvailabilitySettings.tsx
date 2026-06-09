"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  ApiError,
  createAcademyConsultationAvailability,
  createTeacherConsultationAvailability,
  deleteAcademyConsultationAvailability,
  deleteTeacherConsultationAvailability,
  getAcademyConsultationAvailability,
  getAcademyTeachers,
  getTeacherConsultationAvailability,
  updateAcademyConsultationAvailability,
  updateTeacherConsultationAvailability,
} from "@/lib/api";
import type { AcademyTeacherResponse } from "@/types/auth";
import {
  consultationAvailabilityDays,
  consultationAvailabilityTypeLabels,
  consultationAvailabilityTypes,
  type ConsultationAvailabilityDay,
  type ConsultationAvailabilityRequest,
  type ConsultationAvailabilityResponse,
  type ConsultationAvailabilityType,
} from "@/types/consultation";

type AvailabilityForm = {
  dayOfWeek: ConsultationAvailabilityDay;
  startTime: string;
  endTime: string;
  consultationType: ConsultationAvailabilityType;
};

const initialForm: AvailabilityForm = {
  dayOfWeek: "MONDAY",
  startTime: "14:00",
  endTime: "14:30",
  consultationType: "ALL",
};

type AcademyOption = { academyId: number; academyName: string };

export function ConsultationAvailabilitySettings({
  mode = "academy",
  academies = [],
}: {
  mode?: "academy" | "teacher";
  academies?: AcademyOption[];
}) {
  const { accessToken } = useAuth();
  const [slots, setSlots] = useState<ConsultationAvailabilityResponse[]>([]);
  const [teachers, setTeachers] = useState<AcademyTeacherResponse[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [selectedAcademyId, setSelectedAcademyId] = useState("");
  const [selectedDay, setSelectedDay] = useState<ConsultationAvailabilityDay>("MONDAY");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ConsultationAvailabilityResponse | null>(null);
  const [form, setForm] = useState<AvailabilityForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadErrorMessage, setLoadErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadAvailability = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    setLoadErrorMessage("");
    try {
      const response = mode === "academy"
        ? await getAcademyConsultationAvailability(accessToken)
        : await getTeacherConsultationAvailability(accessToken);
      setSlots(response);
    } catch (error) {
      setLoadErrorMessage(error instanceof ApiError ? error.message : "상담 가능 시간을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, mode]);

  useEffect(() => {
    void Promise.resolve().then(() => loadAvailability());
  }, [loadAvailability]);

  useEffect(() => {
    if (!accessToken || mode !== "academy") return;
    void getAcademyTeachers(accessToken).then((response) => {
      const activeTeachers = response.filter((teacher) => teacher.memberStatus === "ACTIVE");
      setTeachers(activeTeachers);
      setSelectedTeacherId((current) => current || "ACADEMY_ACCOUNT");
    });
  }, [accessToken, mode]);

  const effectiveAcademyId = selectedAcademyId || (academies[0] ? String(academies[0].academyId) : "");

  const visibleSlots = useMemo(
    () => slots.filter((slot) => {
      if (mode === "academy") {
        return selectedTeacherId === "ACADEMY_ACCOUNT"
          ? slot.consultantType === "ACADEMY_ACCOUNT"
          : slot.teacherUserId === Number(selectedTeacherId);
      }
      return !effectiveAcademyId || slot.academyId === Number(effectiveAcademyId);
    }),
    [effectiveAcademyId, mode, selectedTeacherId, slots],
  );

  const slotCountByDay = useMemo(() => new Map(
    consultationAvailabilityDays.map((day) => [
      day.value,
      visibleSlots.filter((slot) => slot.dayOfWeek === day.value).length,
    ]),
  ), [visibleSlots]);

  const selectedDaySlots = useMemo(
    () => visibleSlots
      .filter((slot) => slot.dayOfWeek === selectedDay)
      .sort((a, b) => normalizeTime(a.startTime).localeCompare(normalizeTime(b.startTime))),
    [selectedDay, visibleSlots],
  );

  const selectedDayLabel = consultationAvailabilityDays.find((day) => day.value === selectedDay)?.label ?? "요일";
  const selectedConsultantName = mode === "teacher"
    ? "내 상담"
    : selectedTeacherId === "ACADEMY_ACCOUNT"
      ? "학원 상담"
      : teachers.find((teacher) => String(teacher.teacherUserId) === selectedTeacherId)?.name ?? "담당자";
  const activeDayCount = consultationAvailabilityDays.filter((day) =>
    visibleSlots.some((slot) => slot.dayOfWeek === day.value && slot.status === "ACTIVE"),
  ).length;

  const openCreateForm = () => {
    setEditingSlot(null);
    setForm({ ...initialForm, dayOfWeek: selectedDay });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const openEditForm = (slot: ConsultationAvailabilityResponse) => {
    setEditingSlot(slot);
    setForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: normalizeTime(slot.startTime),
      endTime: normalizeTime(slot.endTime),
      consultationType: slot.consultationType,
    });
    setErrorMessage("");
    setIsFormOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) {
      setErrorMessage("로그인이 필요합니다.");
      return;
    }

    const validationMessage = validateSlot(form, visibleSlots, editingSlot?.availabilityId);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    const payload: ConsultationAvailabilityRequest = {
      ...form,
      academyId: mode === "teacher" ? Number(effectiveAcademyId) : null,
      consultantType: mode === "teacher" || selectedTeacherId !== "ACADEMY_ACCOUNT" ? "TEACHER" : "ACADEMY_ACCOUNT",
      teacherUserId: mode === "academy" && selectedTeacherId !== "ACADEMY_ACCOUNT"
        ? Number(selectedTeacherId)
        : null,
    };
    setIsSaving(true);
    setErrorMessage("");
    try {
      if (editingSlot) {
        if (mode === "academy") {
          await updateAcademyConsultationAvailability(editingSlot.availabilityId, payload, accessToken);
        } else {
          await updateTeacherConsultationAvailability(editingSlot.availabilityId, payload, accessToken);
        }
      } else {
        if (mode === "academy") {
          await createAcademyConsultationAvailability(payload, accessToken);
        } else {
          await createTeacherConsultationAvailability(payload, accessToken);
        }
      }
      setForm((current) => ({ ...initialForm, dayOfWeek: current.dayOfWeek }));
      setEditingSlot(null);
      setIsFormOpen(false);
      await loadAvailability();
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : "상담 가능 시간을 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  const deactivateSlot = async (slot: ConsultationAvailabilityResponse) => {
    if (!accessToken) {
      return;
    }

    setLoadErrorMessage("");
    try {
      if (mode === "academy") {
        await deleteAcademyConsultationAvailability(slot.availabilityId, accessToken);
      } else {
        await deleteTeacherConsultationAvailability(slot.availabilityId, accessToken);
      }
      await loadAvailability();
    } catch (error) {
      setLoadErrorMessage(error instanceof ApiError ? error.message : "상담 가능 시간을 비활성화하지 못했습니다.");
    }
  };

  return (
    <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{mode === "academy" ? "상담 가능 시간" : "내 상담 가능 시간"}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {mode === "academy"
              ? "학원 상담과 선생님별 재원생 상담 가능 시간을 설정합니다."
              : "학부모가 상담 요청을 보낼 수 있는 시간을 설정합니다."}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          disabled={mode === "academy" ? !selectedTeacherId : !effectiveAcademyId}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800"
        >
          시간 추가
        </button>
      </div>

      {loadErrorMessage ? (
        <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          <p>{loadErrorMessage}</p>
          <button type="button" onClick={loadAvailability} className="mt-2 font-bold text-red-700 underline">
            다시 시도
          </button>
        </div>
      ) : null}

      <div className="mt-5 max-w-md">
        {mode === "academy" ? (
          <label className="block">
            <span className="text-sm font-bold text-slate-700">상담 담당자</span>
            <select
              value={selectedTeacherId}
              onChange={(event) => setSelectedTeacherId(event.target.value)}
              className="mt-2 h-11 w-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
            >
              <option value="ACADEMY_ACCOUNT">학원 상담</option>
              {teachers.map((teacher) => (
                <option key={teacher.teacherUserId} value={teacher.teacherUserId}>{teacher.name}</option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className="text-sm font-bold text-slate-700">학원 선택</span>
            <select
              value={effectiveAcademyId}
              onChange={(event) => setSelectedAcademyId(event.target.value)}
              className="mt-2 h-11 w-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900"
            >
              {academies.map((academy) => (
                <option key={academy.academyId} value={academy.academyId}>{academy.academyName}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <AvailabilitySummary label="선택 담당자" value={selectedConsultantName} />
        <AvailabilitySummary label="등록된 전체 슬롯" value={`${visibleSlots.length}개`} />
        <AvailabilitySummary label="상담 가능 요일" value={`${activeDayCount}일`} />
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
        {consultationAvailabilityDays.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => setSelectedDay(day.value)}
            className={`h-10 min-w-12 rounded-2xl px-4 text-sm font-bold transition ${
              selectedDay === day.value ? "bg-blue-700 text-white shadow-lg shadow-blue-100" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            }`}
          >
            {day.shortLabel}({slotCountByDay.get(day.value) ?? 0})
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-500">
          상담 가능 시간을 불러오는 중입니다.
        </p>
      ) : (
        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/70">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
            <div>
              <h3 className="font-bold text-slate-950">{selectedDayLabel}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">{selectedConsultantName}의 등록 시간</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {selectedDaySlots.length}개
            </span>
          </div>
          <div className="grid max-h-[420px] gap-2 overflow-y-auto p-3">
            {selectedDaySlots.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-500">
                등록된 상담 가능 시간이 없습니다.
              </p>
            ) : null}
            {selectedDaySlots.map((slot) => (
              <AvailabilitySlotCard
                key={slot.availabilityId}
                slot={slot}
                onEdit={openEditForm}
                onDeactivate={deactivateSlot}
              />
            ))}
          </div>
        </section>
      )}

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
          <section className="w-full max-w-xl rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{editingSlot ? "시간 수정" : "시간 추가"}</h2>
                  <p className="mt-1 text-sm text-slate-600">{selectedConsultantName} · {selectedDayLabel}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
                  aria-label="상담 가능 시간 설정 닫기"
                >
                  x
                </button>
              </div>
            </div>
            <form className="grid gap-4 px-5 py-5" onSubmit={handleSubmit}>
              {errorMessage ? (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {errorMessage}
                </p>
              ) : null}
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-bold text-slate-500">상담 담당자</p>
                <p className="mt-1 text-sm font-bold text-slate-900">{selectedConsultantName}</p>
              </div>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">요일</span>
                <select
                  value={form.dayOfWeek}
                  onChange={(event) => setForm((current) => ({ ...current, dayOfWeek: event.target.value as ConsultationAvailabilityDay }))}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {consultationAvailabilityDays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <TimeField label="시작 시간" value={form.startTime} onChange={(value) => setForm((current) => ({ ...current, startTime: value }))} />
                <TimeField label="종료 시간" value={form.endTime} onChange={(value) => setForm((current) => ({ ...current, endTime: value }))} />
              </div>
              <label className="block">
                <span className="text-sm font-bold text-slate-700">상담 유형</span>
                <select
                  value={form.consultationType}
                  onChange={(event) => setForm((current) => ({ ...current, consultationType: event.target.value as ConsultationAvailabilityType }))}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {consultationAvailabilityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
              >
                {isSaving ? "저장 중" : editingSlot ? "시간 수정" : "시간 추가"}
              </button>
            </form>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function AvailabilitySlotCard({
  slot,
  onEdit,
  onDeactivate,
}: {
  slot: ConsultationAvailabilityResponse;
  onEdit: (slot: ConsultationAvailabilityResponse) => void;
  onDeactivate: (slot: ConsultationAvailabilityResponse) => void;
}) {
  const active = slot.status === "ACTIVE";

  return (
    <article className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold text-slate-950">
              {normalizeTime(slot.startTime)} - {normalizeTime(slot.endTime)}
            </p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {active ? "활성" : "비활성"}
            </span>
            <span className="text-xs font-bold text-slate-500">{consultationAvailabilityTypeLabels[slot.consultationType]}</span>
          </div>
          <p className="mt-1 truncate text-xs font-semibold text-slate-500">{slot.academyName} · {slot.consultantName}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onEdit(slot)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => onDeactivate(slot)}
            disabled={!active}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-red-100 bg-white px-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          >
            비활성화
          </button>
        </div>
      </div>
    </article>
  );
}

function AvailabilitySummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function validateSlot(
  form: AvailabilityForm,
  slots: ConsultationAvailabilityResponse[],
  editingAvailabilityId?: number,
) {
  if (form.startTime >= form.endTime) {
    return "시작 시간은 종료 시간보다 빨라야 합니다.";
  }

  const overlaps = slots.some((slot) => {
    if (slot.status !== "ACTIVE" || slot.dayOfWeek !== form.dayOfWeek || slot.availabilityId === editingAvailabilityId) {
      return false;
    }
    return form.startTime < normalizeTime(slot.endTime) && normalizeTime(slot.startTime) < form.endTime;
  });

  if (overlaps) {
    return "같은 요일에 겹치는 상담 시간이 있습니다.";
  }

  return "";
}

function normalizeTime(time: string) {
  return time.slice(0, 5);
}
