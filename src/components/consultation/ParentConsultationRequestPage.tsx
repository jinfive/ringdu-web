"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { ConsultationCalendar, toDateKey } from "./ConsultationCalendar";
import { ConsultationTimeSlots } from "./ConsultationTimeSlots";
import {
  consultationTimeSlots,
  disabledConsultationTimeSlots,
  consultationTopics,
  type ConsultationTopic,
} from "@/types/consultation";

const childOptions = [
  {
    id: "student-kim",
    name: "김학생",
    academyName: "지누수학",
    teacherName: "김선생",
    className: "중등 수학 A반",
  },
  {
    id: "student-lee",
    name: "이학생",
    academyName: "지누수학",
    teacherName: "박선생",
    className: "초등 수학 B반",
  },
];

export function ParentConsultationRequestPage() {
  const [selectedChildId, setSelectedChildId] = useState(childOptions[0].id);
  const [topic, setTopic] = useState<ConsultationTopic>("학습 상담");
  const [visibleMonth, setVisibleMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [selectedTime, setSelectedTime] = useState("");
  const [message, setMessage] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const selectedChild = childOptions.find((child) => child.id === selectedChildId) ?? childOptions[0];
  const canSubmit = selectedChildId && topic && selectedDate && selectedTime && message.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setIsCompleted(true);
  };

  if (isCompleted) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-7 text-center shadow-xl shadow-emerald-100/60">
          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            요청 완료
          </span>
          <h2 className="mt-5 text-2xl font-bold text-slate-950">상담 요청이 접수되었습니다.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">학원 승인 후 일정이 확정됩니다.</p>
        </div>
        <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryItem label="자녀" value={selectedChild.name} />
            <SummaryItem label="학원" value={selectedChild.academyName} />
            <SummaryItem label="담당 선생님" value={selectedChild.teacherName} />
            <SummaryItem label="일정" value={`${selectedDate} ${selectedTime}`} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.7fr)]" onSubmit={handleSubmit}>
      <div className="space-y-6">
        <ParentConsultationSection title="자녀와 학원">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">자녀 선택</span>
              <select
                value={selectedChildId}
                onChange={(event) => setSelectedChildId(event.target.value)}
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {childOptions.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-700">학원 선택</span>
              <select
                value={selectedChild.academyName}
                disabled
                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700"
              >
                <option>{selectedChild.academyName}</option>
              </select>
            </label>
          </div>
          <div className="mt-4 rounded-3xl border border-blue-100 bg-blue-50/80 p-4">
            <p className="text-sm font-bold text-blue-700">담당 선생님: {selectedChild.teacherName}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700">수업: {selectedChild.className}</p>
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
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </ParentConsultationSection>

        <ParentConsultationSection title="시간 선택">
          {/* TODO: GET /api/academies/{academyId}/consultation-availability로 자녀 학원의 상담 가능 시간을 조회한다. */}
          <p className="mb-3 text-sm font-semibold text-slate-600">
            {selectedDate} 학원이 등록한 상담 가능 시간 중 선택합니다.
          </p>
          <ConsultationTimeSlots
            slots={consultationTimeSlots}
            disabledSlots={disabledConsultationTimeSlots}
            selectedTime={selectedTime}
            onTimeSelect={setSelectedTime}
          />
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
            disabled={!canSubmit}
            className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-200/70 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            상담 요청하기
          </button>
        </ParentConsultationSection>
      </aside>
    </form>
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
