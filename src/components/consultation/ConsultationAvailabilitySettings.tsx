"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  consultationAvailabilityDays,
  consultationAvailabilityTypes,
  mockConsultationAvailabilitySlots,
  type ConsultationAvailabilityDay,
  type ConsultationAvailabilitySlot,
  type ConsultationAvailabilityType,
} from "@/types/consultation";

type AvailabilityForm = {
  dayOfWeek: ConsultationAvailabilityDay;
  startTime: string;
  endTime: string;
  type: ConsultationAvailabilityType;
};

const initialForm: AvailabilityForm = {
  dayOfWeek: "MONDAY",
  startTime: "14:00",
  endTime: "14:30",
  type: "전체",
};

export function ConsultationAvailabilitySettings() {
  const [slots, setSlots] = useState<ConsultationAvailabilitySlot[]>(mockConsultationAvailabilitySlots);
  const [selectedDay, setSelectedDay] = useState<ConsultationAvailabilityDay>("MONDAY");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<AvailabilityForm>(initialForm);
  const [errorMessage, setErrorMessage] = useState("");
  const slotsByDay = useMemo(
    () =>
      consultationAvailabilityDays.map((day) => ({
        ...day,
        slots: slots
          .filter((slot) => slot.dayOfWeek === day.value)
          .sort((a, b) => a.startTime.localeCompare(b.startTime)),
      })),
    [slots],
  );

  const selectedDayLabel = consultationAvailabilityDays.find((day) => day.value === selectedDay)?.label ?? "요일";

  const handleAddSlot = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationMessage = validateSlot(form, slots);
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setSlots((current) => [
      ...current,
      {
        id: `availability-${Date.now()}`,
        ...form,
        active: true,
      },
    ]);
    setForm((current) => ({ ...initialForm, dayOfWeek: current.dayOfWeek }));
    setErrorMessage("");
    setIsFormOpen(false);
  };

  const toggleActive = (slotId: string) => {
    setSlots((current) => current.map((slot) => (slot.id === slotId ? { ...slot, active: !slot.active } : slot)));
  };

  const deleteSlot = (slotId: string) => {
    setSlots((current) => current.filter((slot) => slot.id !== slotId));
  };

  return (
    <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">상담 가능 시간</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            신규 상담과 재원생 상담 요청을 받을 수 있는 시간을 설정합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm((current) => ({ ...current, dayOfWeek: selectedDay }));
            setErrorMessage("");
            setIsFormOpen(true);
          }}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800"
        >
          시간 추가
        </button>
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
            {day.shortLabel}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {slotsByDay.map((day) => (
          <section
            key={day.value}
            className={`rounded-3xl border p-4 ${
              selectedDay === day.value ? "border-blue-200 bg-blue-50/50" : "border-slate-200 bg-slate-50/80"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-slate-950">{day.label}</h3>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
                {day.slots.length}개
              </span>
            </div>
            <div className="mt-3 grid gap-2">
              {day.slots.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-sm font-semibold text-slate-500">
                  등록된 상담 가능 시간이 없습니다.
                </p>
              ) : null}
              {day.slots.map((slot) => (
                <AvailabilitySlotCard key={slot.id} slot={slot} onToggleActive={toggleActive} onDelete={deleteSlot} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
          <section className="w-full max-w-xl rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">시간 추가</h2>
                  <p className="mt-1 text-sm text-slate-600">{selectedDayLabel} 상담 가능 시간을 등록합니다.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
                  aria-label="상담 가능 시간 추가 닫기"
                >
                  ×
                </button>
              </div>
            </div>
            <form className="grid gap-4 px-5 py-5" onSubmit={handleAddSlot}>
              {errorMessage ? (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {errorMessage}
                </p>
              ) : null}
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
                  value={form.type}
                  onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as ConsultationAvailabilityType }))}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {consultationAvailabilityTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800"
              >
                시간 추가
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
  onToggleActive,
  onDelete,
}: {
  slot: ConsultationAvailabilitySlot;
  onToggleActive: (slotId: string) => void;
  onDelete: (slotId: string) => void;
}) {
  const dayLabel = consultationAvailabilityDays.find((day) => day.value === slot.dayOfWeek)?.label ?? slot.dayOfWeek;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-slate-950">{dayLabel}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${slot.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
              {slot.active ? "활성" : "비활성"}
            </span>
          </div>
          <p className="mt-2 text-lg font-bold text-slate-950">
            {slot.startTime} - {slot.endTime}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{slot.type}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => onToggleActive(slot.id)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            {slot.active ? "비활성화" : "활성화"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(slot.id)}
            className="inline-flex h-10 items-center justify-center rounded-2xl border border-red-100 bg-white px-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>
    </article>
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

function validateSlot(form: AvailabilityForm, slots: ConsultationAvailabilitySlot[]) {
  if (form.startTime >= form.endTime) {
    return "시작 시간은 종료 시간보다 빨라야 합니다.";
  }

  const overlaps = slots.some((slot) => {
    if (slot.dayOfWeek !== form.dayOfWeek) {
      return false;
    }
    return form.startTime < slot.endTime && slot.startTime < form.endTime;
  });

  if (overlaps) {
    return "같은 요일에 겹치는 상담 시간이 있습니다.";
  }

  return "";
}
