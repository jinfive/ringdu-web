"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AcademyCard, AcademyLinkButton, AcademyShell, EmptyState, StatusBadge } from "@/components/academy/AcademyShell";
import { useAuth } from "@/components/auth/AuthProvider";
import {
  attendanceStatusLabels,
  attendanceStatusStyles,
  countAttendanceStatuses,
  mockAttendanceRecords,
  type AttendanceStatus,
  type AttendanceRecord,
} from "@/types/attendance";
import {
  addAcademyClassStudent,
  ApiError,
  createAcademyClass,
  createAcademyClassroom,
  deleteAcademyClassroom,
  removeAcademyClassStudent,
  getAcademyClass,
  getAcademyClasses,
  getAcademyClassrooms,
  getAcademyTeachers,
  searchAcademyStudents,
  updateAcademyClassroom,
} from "@/lib/api";
import type { AcademyStudentResponse, AcademyTeacherResponse } from "@/types/auth";
import type { AcademyClassDetailResponse, AcademyClassRequest, ScheduleDayOfWeek } from "@/types/schedule";
import type { Classroom, ScheduleClass, ScheduleDay } from "./types";

const DAYS: { value: ScheduleDay; label: string }[] = [
  { value: "MONDAY", label: "월" },
  { value: "TUESDAY", label: "화" },
  { value: "WEDNESDAY", label: "수" },
  { value: "THURSDAY", label: "목" },
  { value: "FRIDAY", label: "금" },
  { value: "SATURDAY", label: "토" },
  { value: "SUNDAY", label: "일" },
];
const START_HOUR = 8;
const END_HOUR = 22;
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;

type ClassForm = {
  name: string;
  dayOfWeek: ScheduleDayOfWeek;
  startTime: string;
  endTime: string;
  classroomId: string;
  teacherUserId: string;
  memo: string;
};

type ClassDetailTab = "기본 정보" | "수강 학생" | "출석 관리" | "숙제 관리 준비 중";
const classDetailTabs: ClassDetailTab[] = ["기본 정보", "수강 학생", "출석 관리", "숙제 관리 준비 중"];

export function AcademySchedulePage() {
  const { accessToken, user } = useAuth();
  const isPendingApproval = user?.status === "PENDING_APPROVAL";
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [classes, setClasses] = useState<ScheduleClass[]>([]);
  const [teachers, setTeachers] = useState<AcademyTeacherResponse[]>([]);
  const [selectedDay, setSelectedDay] = useState<ScheduleDay>("MONDAY");
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [setupCount, setSetupCount] = useState(3);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isCreatingRooms, setIsCreatingRooms] = useState(false);

  const loadSchedule = useCallback(() => {
    if (!accessToken || isPendingApproval) return;

    setIsLoading(true);
    setErrorMessage("");
    void Promise.all([
      getAcademyClassrooms(accessToken),
      getAcademyClasses(accessToken, { status: "ACTIVE" }),
      getAcademyTeachers(accessToken).catch(() => [] as AcademyTeacherResponse[]),
    ])
      .then(([classroomData, classData, teacherData]) => {
        setClassrooms(classroomData);
        setClasses(classData);
        setTeachers(teacherData.filter((teacher) => teacher.memberStatus === "ACTIVE"));
      })
      .catch((error) => {
        setErrorMessage(getScheduleErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, isPendingApproval]);

  useEffect(() => {
    void Promise.resolve().then(loadSchedule);
  }, [loadSchedule]);

  const selectedDayClasses = useMemo(() => classes.filter((item) => item.dayOfWeek === selectedDay), [classes, selectedDay]);

  async function createRoomsFromCount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!accessToken) return;

    const count = Math.max(1, Math.min(20, setupCount));
    setIsCreatingRooms(true);
    setActionError("");

    try {
      for (let index = 1; index <= count; index += 1) {
        await createAcademyClassroom({ name: `${index}강의실` }, accessToken);
      }
      loadSchedule();
    } catch (error) {
      setActionError(getScheduleErrorMessage(error));
    } finally {
      setIsCreatingRooms(false);
    }
  }

  async function addClass(form: ClassForm) {
    if (!accessToken) return;

    const payload: AcademyClassRequest = {
      name: form.name.trim(),
      dayOfWeek: form.dayOfWeek,
      classroomId: Number(form.classroomId),
      teacherUserId: form.teacherUserId ? Number(form.teacherUserId) : null,
      startTime: form.startTime,
      endTime: form.endTime,
      memo: form.memo.trim() || null,
    };

    await createAcademyClass(payload, accessToken);
    setSelectedDay(form.dayOfWeek);
    setIsClassModalOpen(false);
    loadSchedule();
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
            disabled={classrooms.length === 0 || isLoading}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
          >
            수업 추가
          </button>
          <button
            type="button"
            onClick={() => setIsRoomModalOpen(true)}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            강의실 관리
          </button>
        </>
      }
    >
      <div className="space-y-6">
        {errorMessage ? (
          <ErrorBanner message={errorMessage} onRetry={loadSchedule} />
        ) : null}

        {actionError ? (
          <p className="whitespace-pre-line rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {actionError}
          </p>
        ) : null}

        {isLoading ? (
          <AcademyCard>
            <p className="text-sm font-semibold text-slate-600">시간표를 불러오고 있습니다.</p>
          </AcademyCard>
        ) : null}

        {!isLoading && classrooms.length === 0 ? (
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
                    className={inputClassName}
                  />
                </label>
                <button
                  type="submit"
                  disabled={isCreatingRooms}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"
                >
                  {isCreatingRooms ? "생성 중" : "자동 생성"}
                </button>
              </form>
            </div>
          </AcademyCard>
        ) : null}

        <AcademyCard>
          <div className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {DAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => setSelectedDay(day.value)}
                  className={`h-11 min-w-12 shrink-0 rounded-2xl border px-4 text-sm font-black transition ${
                    selectedDay === day.value ? "border-blue-700 bg-blue-700 text-white shadow-lg shadow-blue-200/70" : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <SummaryTile label="선택 요일" value={`${getDayLabel(selectedDay)}요일 시간표`} />
              <SummaryTile label="시간 범위" value="08:00 - 22:00" />
              <SummaryTile label="강의실 열" value={`${classrooms.length}개 강의실`} />
            </div>
          </div>
        </AcademyCard>

        {!isLoading && !errorMessage ? (
          <>
            <div className="hidden md:block">
              <ScheduleGrid day={selectedDay} classrooms={classrooms} classes={selectedDayClasses} />
            </div>
            <div className="md:hidden">
              <ScheduleMobileDayView day={selectedDay} classes={selectedDayClasses} classrooms={classrooms} />
            </div>
          </>
        ) : null}
      </div>

      {isRoomModalOpen && accessToken ? (
        <ClassroomManagerModal
          accessToken={accessToken}
          classrooms={classrooms}
          classes={classes}
          onCompleted={loadSchedule}
          onClose={() => setIsRoomModalOpen(false)}
        />
      ) : null}

      {isClassModalOpen && accessToken ? (
        <ClassCreateModal classrooms={classrooms} teachers={teachers} onCreate={addClass} onClose={() => setIsClassModalOpen(false)} />
      ) : null}
    </AcademyShell>
  );
}

function ScheduleGrid({ day, classrooms, classes }: { day: ScheduleDay; classrooms: Classroom[]; classes: ScheduleClass[] }) {
  const hourLabels = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
  const minWidth = 72 + Math.max(classrooms.length, 1) * 180;

  return (
    <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
      <div className="grid" style={{ gridTemplateColumns: `72px repeat(${Math.max(classrooms.length, 1)}, minmax(160px, 1fr))`, minWidth }}>
        <div className="sticky left-0 z-10 border-b border-r border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-500">시간</div>
        {classrooms.map((room) => (
          <div key={room.classroomId} className="border-b border-r border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-sm font-black text-slate-950">{room.name}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{getDayLabel(day)}요일</p>
          </div>
        ))}
        {classrooms.length === 0 ? (
          <div className="border-b border-r border-slate-200 bg-slate-50 p-3 text-center">
            <p className="text-sm font-black text-slate-950">강의실 없음</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">강의실을 추가해 주세요</p>
          </div>
        ) : null}

        <div className="sticky left-0 z-10 border-r border-slate-200 bg-white">
          <div className="relative h-[840px]">
            {hourLabels.map((hour) => (
              <div key={hour} className="absolute left-0 right-0 -translate-y-1/2 px-3 text-xs font-bold text-slate-400" style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}>
                {String(hour).padStart(2, "0")}:00
              </div>
            ))}
          </div>
        </div>

        {classrooms.map((room) => (
          <div key={room.classroomId} className="relative h-[840px] border-r border-slate-200 bg-white">
            {hourLabels.map((hour) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }} />
            ))}
            {classes
              .filter((item) => item.classroomId === room.classroomId)
              .map((item, index) => (
                <ScheduleClassCard key={item.classId} scheduleClass={item} offsetIndex={index} />
              ))}
          </div>
        ))}
        {classrooms.length === 0 ? (
          <div className="relative h-[840px] border-r border-slate-200 bg-white">
            {hourLabels.map((hour) => (
              <div key={hour} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ScheduleClassCard({ scheduleClass, offsetIndex }: { scheduleClass: ScheduleClass; offsetIndex: number }) {
  const start = timeToMinutes(scheduleClass.startTime) - START_HOUR * 60;
  const end = timeToMinutes(scheduleClass.endTime) - START_HOUR * 60;
  const top = Math.max(0, (start / TOTAL_MINUTES) * 100);
  const height = Math.max(8, ((end - start) / TOTAL_MINUTES) * 100);
  const palette = ["border-blue-100 bg-blue-50 text-blue-950", "border-emerald-100 bg-emerald-50 text-emerald-950", "border-violet-100 bg-violet-50 text-violet-950", "border-amber-100 bg-amber-50 text-amber-950"];

  return (
    <Link
      href={`/academy/schedule/${scheduleClass.classId}`}
      className={`absolute left-2 right-2 rounded-xl border p-3 shadow-lg shadow-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-xl ${palette[offsetIndex % palette.length]}`}
      style={{ top: `${top}%`, height: `${height}%` }}
    >
      <h3 className="line-clamp-2 text-sm font-black">{scheduleClass.name}</h3>
      <p className="mt-1 text-xs font-semibold opacity-80">{scheduleClass.teacherName ?? "담당 선생님 미지정"}</p>
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
        <h2 className="mt-1 text-xl font-black text-slate-950">{getDayLabel(day)}요일 수업</h2>
      </div>
      {classrooms.length === 0 ? (
        <EmptyState title="강의실이 없습니다." description="강의실 관리에서 먼저 강의실을 추가해 주세요." />
      ) : classes.length === 0 ? (
        <EmptyState title="이 요일에 등록된 수업이 없습니다." description="수업 추가 버튼으로 강의실과 시간을 지정해 보세요." />
      ) : (
        classrooms.map((room) => {
          const roomClasses = classes
            .filter((item) => item.classroomId === room.classroomId)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          return (
            <section key={room.classroomId} className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
              <h3 className="text-base font-black text-slate-950">{room.name}</h3>
              {roomClasses.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">등록된 수업이 없습니다.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {roomClasses.map((item) => (
                    <Link key={item.classId} href={`/academy/schedule/${item.classId}`} className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 transition hover:border-blue-200 hover:bg-blue-50">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-slate-950">{item.name}</p>
                          <p className="mt-1 text-xs font-semibold text-slate-600">{item.teacherName ?? "담당 선생님 미지정"}</p>
                        </div>
                        <p className="shrink-0 rounded-2xl bg-white px-3 py-1.5 text-xs font-black text-slate-700">
                          {item.startTime} - {item.endTime}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}

function ClassroomManagerModal({
  accessToken,
  classrooms,
  classes,
  onCompleted,
  onClose,
}: {
  accessToken: string;
  classrooms: Classroom[];
  classes: ScheduleClass[];
  onCompleted: () => void;
  onClose: () => void;
}) {
  const [roomNames, setRoomNames] = useState(() => Object.fromEntries(classrooms.map((room) => [room.classroomId, room.name])));
  const [newRoomName, setNewRoomName] = useState(`${classrooms.length + 1}강의실`);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function renameRoom(roomId: number) {
    const name = roomNames[roomId]?.trim();
    if (!name) return;

    await runAction(async () => {
      await updateAcademyClassroom(roomId, { name }, accessToken);
      onCompleted();
    });
  }

  async function addRoom() {
    const name = newRoomName.trim();
    if (!name) return;

    await runAction(async () => {
      await createAcademyClassroom({ name }, accessToken);
      setNewRoomName("");
      onCompleted();
    });
  }

  async function deleteRoom(roomId: number) {
    await runAction(async () => {
      await deleteAcademyClassroom(roomId, accessToken);
      onCompleted();
    });
  }

  async function runAction(action: () => Promise<void>) {
    setIsSaving(true);
    setErrorMessage("");
    try {
      await action();
    } catch (error) {
      setErrorMessage(getScheduleErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalFrame title="강의실 관리" description="강의실 목록을 수정하고 시간표 기준 공간을 관리합니다." onClose={onClose}>
      <div className="space-y-3">
        {errorMessage ? <p className="whitespace-pre-line rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{errorMessage}</p> : null}
        <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          수업이 배정된 강의실 삭제는 백엔드에서 비활성화 처리됩니다.
        </div>
        {classrooms.map((room) => {
          const classCount = classes.filter((item) => item.classroomId === room.classroomId).length;

          return (
            <div key={room.classroomId} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
              <label>
                <span className="text-xs font-bold text-slate-500">강의실 이름</span>
                <input
                  value={roomNames[room.classroomId] ?? room.name}
                  onChange={(event) => setRoomNames((current) => ({ ...current, [room.classroomId]: event.target.value }))}
                  className="mt-1 h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <button type="button" onClick={() => renameRoom(room.classroomId)} disabled={isSaving} className="inline-flex h-11 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                저장
              </button>
              <button type="button" onClick={() => deleteRoom(room.classroomId)} disabled={isSaving} className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
                삭제{classCount > 0 ? ` (${classCount}개 수업)` : ""}
              </button>
            </div>
          );
        })}
        <div className="grid gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
          <label>
            <span className="text-xs font-bold text-blue-700">새 강의실</span>
            <input value={newRoomName} onChange={(event) => setNewRoomName(event.target.value)} className="mt-1 h-11 w-full rounded-2xl border border-blue-100 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
          </label>
          <button type="button" onClick={addRoom} disabled={isSaving || !newRoomName.trim()} className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
            강의실 추가
          </button>
        </div>
      </div>
    </ModalFrame>
  );
}

function ClassCreateModal({
  classrooms,
  teachers,
  onCreate,
  onClose,
}: {
  classrooms: Classroom[];
  teachers: AcademyTeacherResponse[];
  onCreate: (form: ClassForm) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<ClassForm>({
    name: "",
    dayOfWeek: "MONDAY",
    startTime: "16:00",
    endTime: "17:30",
    classroomId: classrooms[0]?.classroomId ? String(classrooms[0].classroomId) : "",
    teacherUserId: "",
    memo: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.classroomId) return;

    setIsSaving(true);
    setErrorMessage("");
    try {
      await onCreate(form);
    } catch (error) {
      setErrorMessage(getScheduleErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ModalFrame title="수업 추가" description="요일, 강의실, 시간을 선택해 수업을 생성합니다." onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {errorMessage ? <p className="whitespace-pre-line rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{errorMessage}</p> : null}
        <Field label="수업명">
          <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required className={inputClassName} placeholder="중등 수학 A반" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="요일">
            <select value={form.dayOfWeek} onChange={(event) => setForm({ ...form, dayOfWeek: event.target.value as ScheduleDayOfWeek })} className={inputClassName}>
              {DAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="강의실">
            <select value={form.classroomId} onChange={(event) => setForm({ ...form, classroomId: event.target.value })} className={inputClassName}>
              {classrooms.map((room) => (
                <option key={room.classroomId} value={room.classroomId}>
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
            <select value={form.teacherUserId} onChange={(event) => setForm({ ...form, teacherUserId: event.target.value })} className={inputClassName}>
              <option value="">담당 선생님 미지정</option>
              {teachers.map((teacher) => (
                <option key={teacher.teacherUserId} value={teacher.teacherUserId}>
                  {teacher.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {teachers.length === 0 ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            연결된 선생님이 없으면 담당 선생님 없이 수업을 생성할 수 있습니다.
          </p>
        ) : null}
        <Field label="메모">
          <textarea value={form.memo} onChange={(event) => setForm({ ...form, memo: event.target.value })} className={`${inputClassName} min-h-24 py-3`} />
        </Field>
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            취소
          </button>
          <button type="submit" disabled={isSaving} className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-200/70 transition hover:-translate-y-0.5 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
            {isSaving ? "등록 중" : "등록"}
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
        description="요일을 선택한 뒤 강의실, 시간, 담당 선생님을 지정하는 흐름으로 정리했습니다."
        action={<AcademyLinkButton href="/academy/schedule">시간표 관리로 이동</AcademyLinkButton>}
      />
    </AcademyShell>
  );
}

export function AcademyScheduleDetailPage({ classId }: { classId: string }) {
  const { accessToken, user } = useAuth();
  const isPendingApproval = user?.status === "PENDING_APPROVAL";
  const [scheduleClass, setScheduleClass] = useState<AcademyClassDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState<ClassDetailTab>("기본 정보");

  const loadClass = useCallback(() => {
    if (!accessToken || isPendingApproval) return;
    const numericClassId = Number(classId);
    if (!Number.isFinite(numericClassId)) {
      setErrorMessage("수업 정보를 찾을 수 없습니다.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    void getAcademyClass(numericClassId, accessToken)
      .then((data) => {
        setScheduleClass(data);
      })
      .catch((error) => {
        setErrorMessage(getScheduleErrorMessage(error));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [accessToken, classId, isPendingApproval]);

  useEffect(() => {
    void Promise.resolve().then(loadClass);
  }, [loadClass]);

  return (
    <AcademyShell title="수업/클래스 상세 관리" description={scheduleClass ? `${scheduleClass.name} 수업 정보를 확인합니다.` : "수업 정보를 확인합니다."}>
      <div className="space-y-6">
        <ClassDetailTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {errorMessage ? <ErrorBanner message={errorMessage} onRetry={loadClass} /> : null}
        {isLoading ? (
          <AcademyCard>
            <p className="text-sm font-semibold text-slate-600">수업 정보를 불러오고 있습니다.</p>
          </AcademyCard>
        ) : null}

        {scheduleClass ? (
          <>
            {activeTab === "기본 정보" ? (
              <AcademyCard>
              <div className="grid gap-4 md:grid-cols-2">
                <DetailItem label="수업명" value={scheduleClass.name} />
                <DetailItem label="요일/시간" value={`${scheduleClass.dayLabel} ${scheduleClass.startTime} - ${scheduleClass.endTime}`} />
                <DetailItem label="강의실" value={scheduleClass.classroomName} />
                <DetailItem label="담당 선생님" value={scheduleClass.teacherName ?? "담당 선생님 미지정"} />
                <DetailItem label="수강 학생 수" value={`${scheduleClass.studentCount}명`} />
                <DetailItem label="메모" value={scheduleClass.memo || "메모 없음"} />
              </div>
              </AcademyCard>
            ) : null}

            {activeTab === "수강 학생" ? (
              <ClassStudentsPanel
                scheduleClass={scheduleClass}
                accessToken={accessToken}
                onChanged={loadClass}
              />
            ) : null}

            {activeTab === "출석 관리" ? <AcademyClassAttendancePanel scheduleClass={scheduleClass} /> : null}

            {activeTab === "숙제 관리 준비 중" ? (
              <AcademyCard>
                <h2 className="text-lg font-bold text-slate-950">{activeTab}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">이번 작업에서는 실제 기능을 구현하지 않고 상세 화면 진입 구조만 유지합니다.</p>
              </AcademyCard>
            ) : null}
          </>
        ) : null}
      </div>
    </AcademyShell>
  );
}

function AcademyClassAttendancePanel({ scheduleClass }: { scheduleClass: AcademyClassDetailResponse }) {
  const records = getMockClassAttendanceRecords(scheduleClass);
  const counts = countAttendanceStatuses(records);

  return (
    <AcademyCard>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">날짜별 출석 현황</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">출석 처리는 담당 선생님 화면에서 진행됩니다.</p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">
          조회 전용
        </span>
      </div>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-slate-950">2026-06-01</p>
            <p className="mt-1 text-sm text-slate-600">
              {scheduleClass.name} · {scheduleClass.dayLabel} {scheduleClass.startTime} - {scheduleClass.endTime}
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-500">mock 데이터</p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {(Object.keys(attendanceStatusLabels) as AttendanceStatus[]).map((status) => (
            <div key={status} className="rounded-2xl border border-white bg-white px-4 py-3 shadow-sm">
              <p className="text-xs font-bold text-slate-500">{attendanceStatusLabels[status]}</p>
              <p className="mt-2 text-xl font-black text-slate-950">{counts[status]}명</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-3">
          {records.map((record) => (
            <div key={record.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-slate-950">{record.studentName}</p>
                  <p className="mt-1 text-sm text-slate-600">{record.memo || "메모 없음"}</p>
                </div>
                <ScheduleAttendanceStatusBadge status={record.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AcademyCard>
  );
}

function ScheduleAttendanceStatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${attendanceStatusStyles[status]}`}>
      {attendanceStatusLabels[status]}
    </span>
  );
}

function getMockClassAttendanceRecords(scheduleClass: AcademyClassDetailResponse): AttendanceRecord[] {
  const sampleRecords = mockAttendanceRecords.filter((record) => record.classId === "sample-class");

  if (scheduleClass.students.length === 0) {
    return sampleRecords;
  }

  const statuses = Object.keys(attendanceStatusLabels) as AttendanceStatus[];
  return scheduleClass.students.slice(0, 5).map((student, index) => ({
    id: `class-${scheduleClass.classId}-attendance-${student.studentProfileId}`,
    classId: String(scheduleClass.classId),
    className: scheduleClass.name,
    date: "2026-06-01",
    studentId: String(student.studentProfileId),
    studentName: student.name,
    status: statuses[index % statuses.length],
    memo: index === 1 ? "10분 지각" : "",
  }));
}

function ClassDetailTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: ClassDetailTab;
  onTabChange: (tab: ClassDetailTab) => void;
}) {
  return (
    <div className="max-w-full overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2 [scrollbar-width:thin]">
      <div className="flex w-max max-w-none gap-1.5 whitespace-nowrap pr-2">
        {classDetailTabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
              className={`h-9 shrink-0 rounded-2xl px-3 text-xs font-bold transition sm:h-10 sm:px-4 sm:text-sm ${
                isActive
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ClassStudentsPanel({
  scheduleClass,
  accessToken,
  onChanged,
}: {
  scheduleClass: AcademyClassDetailResponse;
  accessToken: string | null;
  onChanged: () => void;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRemoveStudent = async (studentProfileId: number) => {
    if (!accessToken) return;
    const confirmed = window.confirm("이 학생을 수업에서 제외할까요?");
    if (!confirmed) return;

    setRemovingStudentId(studentProfileId);
    setErrorMessage("");
    try {
      await removeAcademyClassStudent(scheduleClass.classId, studentProfileId, accessToken);
      onChanged();
    } catch (error) {
      setErrorMessage(getScheduleErrorMessage(error));
    } finally {
      setRemovingStudentId(null);
    }
  };

  return (
    <AcademyCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-950">수강 학생</h2>
          <p className="mt-1 text-sm text-slate-600">이 수업을 듣는 학생을 검색해 추가하거나 제외합니다.</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge>{scheduleClass.studentCount}명</StatusBadge>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800"
          >
            학생 추가
          </button>
        </div>
      </div>

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
          {errorMessage}
        </p>
      ) : null}

      {scheduleClass.students.length === 0 ? (
        <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6">
          <h3 className="text-lg font-bold text-slate-950">아직 수강 학생이 없습니다.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">이 수업을 듣는 학생을 추가해 보세요.</p>
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="mt-5 inline-flex h-10 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800"
          >
            학생 추가
          </button>
        </div>
      ) : (
        <div className="mt-4 grid gap-3">
          {scheduleClass.students.map((student) => (
            <div key={student.studentProfileId} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <DetailItem label="이름" value={student.name} />
                  <DetailItem label="학교/학년" value={`${student.school || "학교 미입력"} / ${student.grade || "학년 미입력"}`} />
                  <DetailItem label="학생 연락처" value={student.phone || "연락처 없음"} />
                  <DetailItem label="보호자 연락처" value={student.guardianPhone || "연락처 없음"} />
                </div>
                <button
                  type="button"
                  onClick={() => void handleRemoveStudent(student.studentProfileId)}
                  disabled={removingStudentId === student.studentProfileId}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-white px-4 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {removingStudentId === student.studentProfileId ? "제외 중" : "수업에서 제외"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isSearchOpen ? (
        <ClassStudentSearchModal
          scheduleClass={scheduleClass}
          accessToken={accessToken}
          onClose={() => setIsSearchOpen(false)}
          onCompleted={() => {
            setIsSearchOpen(false);
            onChanged();
          }}
        />
      ) : null}
    </AcademyCard>
  );
}

function ClassStudentSearchModal({
  scheduleClass,
  accessToken,
  onClose,
  onCompleted,
}: {
  scheduleClass: AcademyClassDetailResponse;
  accessToken: string | null;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [students, setStudents] = useState<AcademyStudentResponse[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [addingStudentId, setAddingStudentId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const enrolledStudentIds = new Set(scheduleClass.students.map((student) => student.studentProfileId));

  const handleSearch = async () => {
    if (!accessToken) return;
    const trimmedKeyword = keyword.trim();
    setHasSearched(true);
    setErrorMessage("");

    if (!trimmedKeyword) {
      setStudents([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchAcademyStudents(trimmedKeyword, accessToken);
      setStudents(data);
    } catch (error) {
      setStudents([]);
      setErrorMessage(getScheduleErrorMessage(error));
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddStudent = async (student: AcademyStudentResponse) => {
    if (!accessToken || enrolledStudentIds.has(student.id)) return;

    setAddingStudentId(student.id);
    setErrorMessage("");
    try {
      await addAcademyClassStudent(scheduleClass.classId, student.id, accessToken);
      onCompleted();
    } catch (error) {
      setErrorMessage(getScheduleErrorMessage(error));
    } finally {
      setAddingStudentId(null);
    }
  };

  return (
    <ModalFrame title="학생 추가" description="학생 이름으로 검색해 이 수업에 추가합니다." onClose={onClose}>
      <div className="space-y-4">
        <form
          className="flex flex-col gap-3 sm:flex-row"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSearch();
          }}
        >
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="학생 이름을 입력하세요."
            className={`${inputClassName} h-11 flex-1`}
          />
          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSearching ? "검색 중" : "검색"}
          </button>
        </form>

        {errorMessage ? (
          <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        ) : null}

        {hasSearched && !isSearching && students.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            검색 결과가 없습니다.
          </p>
        ) : null}

        <div className="grid gap-3">
          {students.map((student) => {
            const alreadyEnrolled = enrolledStudentIds.has(student.id);
            return (
              <div key={student.id} className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-bold text-slate-950">{student.name}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-600">
                      {student.school || "학교 미입력"} / {student.grade || "학년 미입력"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">학생 연락처 {student.phone || "연락처 없음"}</p>
                    <p className="mt-1 text-sm text-slate-600">보호자 연락처 {student.guardianPhone || "연락처 없음"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleAddStudent(student)}
                    disabled={alreadyEnrolled || addingStudentId !== null}
                    className={`inline-flex h-10 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-bold transition ${
                      alreadyEnrolled
                        ? "cursor-not-allowed bg-slate-200 text-slate-500"
                        : "bg-blue-700 text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                    }`}
                  >
                    {alreadyEnrolled ? "이미 수강 중" : addingStudentId === student.id ? "추가 중" : "추가"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ModalFrame>
  );
}

function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="whitespace-pre-line text-sm font-semibold text-red-600">{message}</p>
      <button type="button" onClick={onRetry} className="inline-flex h-11 items-center justify-center rounded-2xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50">
        다시 시도
      </button>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
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
      <p className="mt-1 whitespace-pre-line text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function getDayLabel(day: ScheduleDayOfWeek) {
  return DAYS.find((item) => item.value === day)?.label ?? day;
}

function timeToMinutes(time: string) {
  const [hour = 0, minute = 0] = time.split(":").map(Number);
  return hour * 60 + minute;
}

function getScheduleErrorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "요청을 처리하지 못했습니다.";
}

const inputClassName =
  "h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
