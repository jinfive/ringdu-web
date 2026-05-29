"use client";

import Link from "next/link";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AcademyCard, AcademyLinkButton, AcademyShell, EmptyState, StatusBadge, TabPreview } from "@/components/academy/AcademyShell";
import type { Classroom, ScheduleClass, ScheduleDay } from "./types";

const DAYS: ScheduleDay[] = ["월", "화", "수", "목", "금", "토", "일"];
const TEACHERS = ["김선생", "이선생", "박선생"];
const START_HOUR = 8;
const END_HOUR = 22;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

const mockClassrooms: Classroom[] = [
  { id: "room-1", name: "1강의실" },
  { id: "room-2", name: "2강의실" },
];

const mockClasses: ScheduleClass[] = [
  {
    id: "middle-math-a",
    title: "중등 수학 A반",
    day: "월",
    startTime: "16:00",
    endTime: "17:30",
    classroomId: "room-1",
    teacher: "김선생",
    memo: "프론트 mock 수업",
  },
  {
    id: "high-english-b",
    title: "고등 영어 B반",
    day: "수",
    startTime: "18:00",
    endTime: "20:00",
    classroomId: "room-2",
    teacher: "이선생",
    memo: "프론트 mock 수업",
  },
  {
    id: "elementary-math-c",
    title: "초등 수학 C반",
    day: "토",
    startTime: "10:00",
    endTime: "11:30",
    classroomId: "room-1",
    teacher: "박선생",
    memo: "프론트 mock 수업",
  },
];

type ClassForm = {
  title: string;
  day: ScheduleDay;
  startTime: string;
  endTime: string;
  classroomId: string;
  teacher: string;
  memo: string;
};

export function AcademySchedulePage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>(mockClassrooms);
  const [classes, setClasses] = useState<ScheduleClass[]>(mockClasses);
  const [roomFilter, setRoomFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"weekly" | "room">("weekly");
  const [selectedMobileDay, setSelectedMobileDay] = useState<ScheduleDay>("월");
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [setupCount, setSetupCount] = useState(3);

  const visibleClasses = useMemo(() => {
    if (roomFilter === "all") return classes;
    return classes.filter((item) => item.classroomId === roomFilter);
  }, [classes, roomFilter]);

  const selectedRoomName = roomFilter === "all" ? "전체 강의실" : getClassroomName(classrooms, roomFilter);

  function createRoomsFromCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const count = Math.max(1, Math.min(20, setupCount));
    setClassrooms(Array.from({ length: count }, (_, index) => ({ id: `room-${Date.now()}-${index + 1}`, name: `${index + 1}강의실` })));
  }

  function addClass(form: ClassForm) {
    setClasses((current) => [
      ...current,
      {
        id: `class-${Date.now()}`,
        ...form,
      },
    ]);
    setSelectedMobileDay(form.day);
    setIsClassModalOpen(false);
  }

  return (
    <AcademyShell
      title="시간표 관리"
      description="요일과 강의실별 수업 일정을 관리합니다."
      actions={
        <>
          <button
            type="button"
            onClick={() => setIsClassModalOpen(true)}
            disabled={classrooms.length === 0}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            수업 추가
          </button>
          <button
            type="button"
            onClick={() => setIsRoomModalOpen(true)}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            강의실 관리
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {classrooms.length === 0 ? (
          <AcademyCard className="border-blue-100 bg-blue-50/80 shadow-blue-100/50">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <StatusBadge>첫 설정</StatusBadge>
                <h2 className="mt-3 text-xl font-bold text-slate-950">강의실을 먼저 설정해 주세요.</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">시간표는 강의실 기준으로 관리됩니다.</p>
              </div>
              <form onSubmit={createRoomsFromCount} className="flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-4 sm:flex-row sm:items-end">
                <label className="flex-1">
                  <span className="text-sm font-bold text-slate-700">강의실 개수</span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={setupCount}
                    onChange={(event) => setSetupCount(Number(event.target.value))}
                    className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
                <button type="submit" className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800">
                  자동 생성
                </button>
              </form>
            </div>
          </AcademyCard>
        ) : null}

        <AcademyCard>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-3 sm:grid-cols-3">
              <label>
                <span className="text-sm font-bold text-slate-700">전체 강의실</span>
                <select
                  value={roomFilter}
                  onChange={(event) => setRoomFilter(event.target.value)}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">전체 강의실</option>
                  {classrooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-sm font-bold text-slate-700">강의실별 보기</span>
                <select
                  value={viewMode}
                  onChange={(event) => setViewMode(event.target.value as "weekly" | "room")}
                  className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="weekly">주간 보기</option>
                  <option value="room">강의실별 보기</option>
                </select>
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold text-slate-500">주간 보기</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">08:00 - 22:00 / {selectedRoomName}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedMobileDay(day)}
                  className={`h-10 min-w-10 rounded-2xl border px-3 text-sm font-bold transition md:hidden ${
                    selectedMobileDay === day ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>
        </AcademyCard>

        <div className="hidden md:block">
          <ScheduleGrid classrooms={classrooms} classes={visibleClasses} viewMode={viewMode} />
        </div>

        <div className="md:hidden">
          <ScheduleMobileDayView
            day={selectedMobileDay}
            classes={visibleClasses.filter((item) => item.day === selectedMobileDay)}
            classrooms={classrooms}
          />
        </div>
      </div>

      {isRoomModalOpen ? (
        <ClassroomManagerModal
          classrooms={classrooms}
          classes={classes}
          onChangeClassrooms={(nextClassrooms) => {
            setClassrooms(nextClassrooms);
            if (roomFilter !== "all" && !nextClassrooms.some((room) => room.id === roomFilter)) setRoomFilter("all");
          }}
          onClose={() => setIsRoomModalOpen(false)}
        />
      ) : null}

      {isClassModalOpen ? (
        <ClassCreateModal classrooms={classrooms} onCreate={addClass} onClose={() => setIsClassModalOpen(false)} />
      ) : null}
    </AcademyShell>
  );
}

function ScheduleGrid({ classrooms, classes, viewMode }: { classrooms: Classroom[]; classes: ScheduleClass[]; viewMode: "weekly" | "room" }) {
  const hourLabels = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
  const gridMinWidth = viewMode === "room" ? "min-w-[980px]" : "min-w-[1120px]";

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div className={`${gridMinWidth} grid grid-cols-[72px_repeat(7,minmax(128px,1fr))]`}>
        <div className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-500">시간</div>
        {DAYS.map((day) => (
          <div key={day} className="border-b border-r border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-sm font-black text-slate-950">{day}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{viewMode === "room" ? "강의실별 수업" : "전체 수업"}</p>
          </div>
        ))}

        <div className="sticky left-0 z-10 border-r border-slate-200 bg-white">
          <div className="relative h-[840px]">
            {hourLabels.map((hour) => (
              <div key={hour} className="absolute left-0 right-0 -translate-y-1/2 px-3 text-xs font-bold text-slate-400" style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}>
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {DAYS.map((day) => (
          <div key={day} className="relative h-[840px] border-r border-slate-200 bg-white">
            {hourLabels.map((hour) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }} />
            ))}
            {classes
              .filter((item) => item.day === day)
              .map((item, index) => (
                <ScheduleClassCard
                  key={item.id}
                  scheduleClass={item}
                  classroomName={getClassroomName(classrooms, item.classroomId)}
                  offsetIndex={index}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ScheduleClassCard({ scheduleClass, classroomName, offsetIndex }: { scheduleClass: ScheduleClass; classroomName: string; offsetIndex: number }) {
  const start = timeToMinutes(scheduleClass.startTime) - START_HOUR * 60;
  const end = timeToMinutes(scheduleClass.endTime) - START_HOUR * 60;
  const top = Math.max(0, (start / TOTAL_MINUTES) * 100);
  const height = Math.max(8, ((end - start) / TOTAL_MINUTES) * 100);
  const palette = ["border-blue-100 bg-blue-50 text-blue-950", "border-emerald-100 bg-emerald-50 text-emerald-950", "border-violet-100 bg-violet-50 text-violet-950", "border-amber-100 bg-amber-50 text-amber-950"];

  return (
    <Link
      href={`/academy/schedule/${scheduleClass.id}`}
      className={`absolute left-2 right-2 rounded-xl border p-3 shadow-lg shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-xl ${palette[offsetIndex % palette.length]}`}
      style={{ top: `${top}%`, height: `${height}%` }}
    >
      <span className="inline-flex rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">{classroomName}</span>
      <h3 className="mt-2 line-clamp-2 text-sm font-black">{scheduleClass.title}</h3>
      <p className="mt-1 text-xs font-semibold opacity-80">{scheduleClass.teacher}</p>
      <p className="mt-1 text-xs font-bold opacity-90">
        {scheduleClass.startTime} - {scheduleClass.endTime}
      </p>
    </Link>
  );
}

function ScheduleMobileDayView({ day, classes, classrooms }: { day: ScheduleDay; classes: ScheduleClass[]; classrooms: Classroom[] }) {
  return (
    <div className="space-y-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/60">
        <p className="text-xs font-bold uppercase text-blue-600">선택 요일</p>
        <h2 className="mt-1 text-xl font-black text-slate-950">{day}요일 수업</h2>
      </div>
      {classes.length === 0 ? (
        <EmptyState title="이 요일에 등록된 수업이 없습니다." description="수업 추가 버튼으로 강의실과 시간을 지정해 보세요." />
      ) : (
        classes
          .slice()
          .sort((a, b) => a.startTime.localeCompare(b.startTime))
          .map((item) => (
            <Link key={item.id} href={`/academy/schedule/${item.id}`} className="block rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60 transition hover:-translate-y-0.5 hover:border-blue-100">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <StatusBadge>{getClassroomName(classrooms, item.classroomId)}</StatusBadge>
                  <h3 className="mt-3 text-lg font-black text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-600">{item.teacher}</p>
                </div>
                <p className="shrink-0 rounded-2xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                  {item.startTime} - {item.endTime}
                </p>
              </div>
            </Link>
          ))
      )}
    </div>
  );
}

function ClassroomManagerModal({
  classrooms,
  classes,
  onChangeClassrooms,
  onClose,
}: {
  classrooms: Classroom[];
  classes: ScheduleClass[];
  onChangeClassrooms: (classrooms: Classroom[]) => void;
  onClose: () => void;
}) {
  function renameRoom(roomId: string, name: string) {
    onChangeClassrooms(classrooms.map((room) => (room.id === roomId ? { ...room, name } : room)));
  }

  function addRoom() {
    onChangeClassrooms([...classrooms, { id: `room-${Date.now()}`, name: `${classrooms.length + 1}강의실` }]);
  }

  function deleteRoom(roomId: string) {
    onChangeClassrooms(classrooms.filter((room) => room.id !== roomId));
  }

  return (
    <ModalFrame title="강의실 관리" description="강의실 목록을 수정하고 시간표 기준 공간을 관리합니다." onClose={onClose}>
      <div className="space-y-3">
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          수업이 배정된 강의실 삭제는 현재 UI에서만 경고합니다. 실제 삭제 가능 여부는 후속 백엔드 연동에서 검증합니다.
        </div>
        {classrooms.map((room) => {
          const classCount = classes.filter((item) => item.classroomId === room.id).length;

          return (
            <div key={room.id} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <label>
                <span className="text-xs font-bold text-slate-500">강의실 이름</span>
                <input
                  value={room.name}
                  onChange={(event) => renameRoom(room.id, event.target.value)}
                  className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <button
                type="button"
                onClick={() => deleteRoom(room.id)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100"
              >
                삭제{classCount > 0 ? ` (${classCount}개 수업)` : ""}
              </button>
            </div>
          );
        })}
        <button type="button" onClick={addRoom} className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100">
          강의실 추가
        </button>
      </div>
    </ModalFrame>
  );
}

function ClassCreateModal({ classrooms, onCreate, onClose }: { classrooms: Classroom[]; onCreate: (form: ClassForm) => void; onClose: () => void }) {
  const [form, setForm] = useState<ClassForm>({
    title: "",
    day: "월",
    startTime: "16:00",
    endTime: "17:30",
    classroomId: classrooms[0]?.id ?? "",
    teacher: TEACHERS[0],
    memo: "",
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim() || !form.classroomId) return;
    onCreate({ ...form, title: form.title.trim() });
  }

  return (
    <ModalFrame title="수업 추가" description="백엔드 연결 전까지 local state에만 수업을 추가합니다." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="수업명">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required className={inputClassName} placeholder="중등 수학 A반" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="요일">
            <select value={form.day} onChange={(event) => setForm({ ...form, day: event.target.value as ScheduleDay })} className={inputClassName}>
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
          </Field>
          <Field label="강의실">
            <select value={form.classroomId} onChange={(event) => setForm({ ...form, classroomId: event.target.value })} className={inputClassName}>
              {classrooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="시작 시간">
            <input type="time" step={1800} value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} className={inputClassName} />
          </Field>
          <Field label="종료 시간">
            <input type="time" step={1800} value={form.endTime} onChange={(event) => setForm({ ...form, endTime: event.target.value })} className={inputClassName} />
          </Field>
          <Field label="담당 선생님">
            <select value={form.teacher} onChange={(event) => setForm({ ...form, teacher: event.target.value })} className={inputClassName}>
              {TEACHERS.map((teacher) => (
                <option key={teacher} value={teacher}>
                  {teacher}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="메모">
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} className={`${inputClassName} min-h-24 py-3`} />
        </Field>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            취소
          </button>
          <button type="submit" className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800">
            등록
          </button>
        </div>
      </form>
    </ModalFrame>
  );
}

export function AcademyScheduleNewPage() {
  return (
    <AcademyShell title="시간표 생성" description="수업 생성은 시간표 관리 화면에서 모달로 진행합니다.">
      <EmptyState
        title="시간표 관리 화면에서 수업을 추가해 주세요."
        description="주간 시간표를 보면서 강의실, 요일, 시간을 지정하는 흐름으로 정리했습니다."
        action={<AcademyLinkButton href="/academy/schedule">시간표 관리로 이동</AcademyLinkButton>}
      />
    </AcademyShell>
  );
}

export function AcademyScheduleDetailPage({ classId }: { classId: string }) {
  const scheduleClass = mockClasses.find((item) => item.id === classId) ?? mockClasses[0];
  const classroomName = getClassroomName(mockClassrooms, scheduleClass.classroomId);

  return (
    <AcademyShell title="수업/클래스 상세 관리" description={`${scheduleClass.title} 수업 정보를 확인합니다.`}>
      <div className="space-y-6">
        <TabPreview tabs={["기본 정보", "수강 학생 준비 중", "출석 관리 준비 중", "숙제 관리 준비 중"]} />
        <AcademyCard>
          <div className="grid gap-4 md:grid-cols-2">
            <DetailItem label="수업명" value={scheduleClass.title} />
            <DetailItem label="요일/시간" value={`${scheduleClass.day} ${scheduleClass.startTime} - ${scheduleClass.endTime}`} />
            <DetailItem label="강의실" value={classroomName} />
            <DetailItem label="담당 선생님" value={scheduleClass.teacher} />
          </div>
        </AcademyCard>
        <div className="grid gap-4 md:grid-cols-3">
          {["수강 학생 준비 중", "출석 관리 준비 중", "숙제 관리 준비 중"].map((title) => (
            <AcademyCard key={title}>
              <h2 className="text-lg font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">이번 작업에서는 실제 기능을 구현하지 않고 상세 화면 진입 구조만 준비합니다.</p>
            </AcademyCard>
          ))}
        </div>
      </div>
    </AcademyShell>
  );
}

function ModalFrame({ title, description, children, onClose }: { title: string; description: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 px-4 py-4 backdrop-blur-sm sm:items-center sm:justify-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/80 bg-white p-5 shadow-2xl shadow-slate-900/20 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-600 transition hover:bg-slate-50" aria-label="닫기">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function getClassroomName(classrooms: Classroom[], classroomId: string) {
  return classrooms.find((room) => room.id === classroomId)?.name ?? "강의실 미지정";
}

function timeToMinutes(time: string) {
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}

const inputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
