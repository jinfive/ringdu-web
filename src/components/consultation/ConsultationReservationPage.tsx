"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { ConsultationCalendar, toDateKey } from "./ConsultationCalendar";
import { ConsultationTimeSlots } from "./ConsultationTimeSlots";
import {
  consultationTimeSlots,
  disabledConsultationTimeSlots,
} from "@/types/consultation";

const academyOptions = [
  {
    id: "academy-jinu",
    name: "지누수학",
    description: "초중등 수학 전문",
    status: "상담 가능",
  },
];

export function ConsultationReservationPage() {
  const [selectedAcademyId, setSelectedAcademyId] = useState(academyOptions[0].id);
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState("");
  const [studentName, setStudentName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const canSubmit = selectedAcademyId && selectedDate && selectedTime && studentName.trim() && guardianPhone.trim();
  const selectedAcademy = academyOptions.find((academy) => academy.id === selectedAcademyId) ?? academyOptions[0];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <ConsultationPageShell>
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/80 bg-white/95 p-7 text-center shadow-2xl shadow-slate-200/70">
          <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            요청 완료
          </span>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">상담 요청이 접수되었습니다.</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600">
            학원에서 확인 후 연락드릴 예정입니다.
          </p>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50/80 p-5 text-left">
            <p className="text-sm font-bold text-slate-500">요청 내용</p>
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <ReservationSummary label="학원" value={selectedAcademy.name} />
              <ReservationSummary label="일정" value={`${selectedDate} ${selectedTime}`} />
              <ReservationSummary label="학생" value={studentName} />
              <ReservationSummary label="관심 과목" value={subject || "-"} />
            </dl>
          </div>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800"
          >
            홈으로 이동
          </Link>
        </div>
      </ConsultationPageShell>
    );
  }

  return (
    <ConsultationPageShell>
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <Link href="/" className="text-2xl font-black tracking-tight text-blue-700">
            Ringdu
          </Link>
          <p className="mt-6 text-xs font-bold uppercase text-blue-600">Consultation</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">상담 예약</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">학원과 상담할 날짜와 시간을 선택해 주세요.</p>
        </header>

        <StepIndicator activeStep={selectedTime ? 4 : selectedDate ? 3 : selectedAcademyId ? 2 : 1} />

        <form className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)]" onSubmit={handleSubmit}>
          <div className="space-y-6">
            <ReservationSection title="1. 학원 선택">
              <div className="grid gap-3">
                {academyOptions.map((academy) => (
                  <button
                    key={academy.id}
                    type="button"
                    onClick={() => setSelectedAcademyId(academy.id)}
                    className={`rounded-3xl border p-5 text-left shadow-sm transition ${
                      selectedAcademyId === academy.id
                        ? "border-blue-200 bg-blue-50/80 ring-2 ring-blue-100"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">{academy.name}</h2>
                        <p className="mt-2 text-sm font-semibold text-slate-600">{academy.description}</p>
                      </div>
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
                        {academy.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </ReservationSection>

            <ReservationSection title="2. 날짜 선택">
              <ConsultationCalendar
                visibleMonth={visibleMonth}
                selectedDate={selectedDate}
                onMonthChange={setVisibleMonth}
                onDateSelect={setSelectedDate}
              />
            </ReservationSection>
          </div>

          <aside className="space-y-6">
            <ReservationSection title="3. 시간 선택">
              <p className="mb-3 text-sm font-semibold text-slate-600">{selectedDate} 상담 가능 시간</p>
              <ConsultationTimeSlots
                slots={consultationTimeSlots}
                disabledSlots={disabledConsultationTimeSlots}
                selectedTime={selectedTime}
                onTimeSelect={setSelectedTime}
              />
            </ReservationSection>

            <ReservationSection title="4. 상담 정보 입력">
              <div className="grid gap-4">
                <ReservationField label="학생 이름" value={studentName} onChange={setStudentName} required />
                <ReservationField label="보호자 연락처" value={guardianPhone} onChange={setGuardianPhone} required />
                <ReservationField label="관심 과목" value={subject} onChange={setSubject} />
                <label className="block">
                  <span className="text-sm font-bold text-slate-700">문의 내용</span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    className="mt-2 min-h-28 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                >
                  상담 요청하기
                </button>
              </div>
            </ReservationSection>
          </aside>
        </form>
      </div>
    </ConsultationPageShell>
  );
}

function ConsultationPageShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen px-5 py-8 text-slate-950 lg:px-8">{children}</main>;
}

function StepIndicator({ activeStep }: { activeStep: number }) {
  const steps = ["학원 선택", "날짜 선택", "시간 선택", "정보 입력", "요청 완료"];
  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const active = stepNumber <= activeStep;
        return (
          <div
            key={step}
            className={`rounded-2xl border px-3 py-3 text-sm font-bold ${
              active ? "border-blue-100 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {stepNumber}. {step}
          </div>
        );
      })}
    </div>
  );
}

function ReservationSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
      <h2 className="mb-4 text-lg font-bold text-slate-950">{title}</h2>
      {children}
    </section>
  );
}

function ReservationField({
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

function ReservationSummary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold text-slate-500">{label}</dt>
      <dd className="mt-1 font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
