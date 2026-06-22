"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { TeacherShell } from "@/components/teacher/TeacherPages";
import {
  ApiError,
  createTeacherClassHomework,
  deleteTeacherClassHomework,
  getTeacherClassHomeworkDetail,
  getTeacherClassHomeworks,
  getTeacherHomeworkClasses,
  updateTeacherHomeworkStudentStatus,
} from "@/lib/api";
import {
  homeworkStatusLabels,
  homeworkStatusStyles,
  type HomeworkCreateRequest,
  type HomeworkDetail,
  type HomeworkStudentStatus,
  type HomeworkSummary,
  type HomeworkTargetType,
  type TeacherHomeworkClass,
} from "@/types/homework";

export function TeacherHomeworkPage() {
  const { accessToken } = useAuth();
  const [classes, setClasses] = useState<TeacherHomeworkClass[]>([]);
  const [homeworksByClass, setHomeworksByClass] = useState<Record<number, HomeworkSummary[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const classData = await getTeacherHomeworkClasses(accessToken);
      const homeworkEntries = await Promise.all(classData.map(async (item) => [
        item.classId,
        await getTeacherClassHomeworks(item.classId, accessToken),
      ] as const));
      setClasses(classData);
      setHomeworksByClass(Object.fromEntries(homeworkEntries));
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const allHomeworks = useMemo(() => Object.values(homeworksByClass).flat(), [homeworksByClass]);
  const today = toDateKey(new Date());
  const weekEnd = addDays(today, 7);
  const dueTodayCount = allHomeworks.filter((item) => item.dueDate === today).reduce((sum, item) => sum + item.notDoneCount, 0);
  const notDoneCount = allHomeworks.reduce((sum, item) => sum + item.notDoneCount, 0);
  const weeklyCount = allHomeworks.filter((item) => item.dueDate >= today && item.dueDate <= weekEnd).length;

  return (
    <TeacherShell title="숙제 관리">
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-black text-slate-950">숙제 관리</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">담당 수업의 숙제를 등록하고 해옴 여부를 빠르게 확인합니다.</p>
        </section>

        {errorMessage ? <ErrorNotice message={errorMessage} onRetry={load} /> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="오늘 확인할 학생" value={`${dueTodayCount}명`} emphasis={dueTodayCount > 0} />
          <SummaryCard label="안해옴" value={`${notDoneCount}건`} emphasis={notDoneCount > 0} />
          <SummaryCard label="해옴" value={`${allHomeworks.reduce((sum, item) => sum + item.doneCount, 0)}건`} />
          <SummaryCard label="이번 주 숙제" value={`${weeklyCount}건`} />
        </div>

        {isLoading ? <EmptyState title="담당 수업을 불러오고 있습니다." description="잠시만 기다려 주세요." /> : null}
        {!isLoading && classes.length === 0 ? <EmptyState title="담당 수업이 없습니다." description="학원에서 담당 수업을 연결하면 숙제를 관리할 수 있습니다." /> : null}

        <section className="grid gap-4 lg:grid-cols-2">
          {classes.map((homeworkClass) => {
            const homeworks = homeworksByClass[homeworkClass.classId] ?? [];
            const latest = homeworks[0];
            const classNotDoneCount = homeworks.reduce((sum, item) => sum + item.notDoneCount, 0);
            return (
              <article key={homeworkClass.classId} className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-950">{homeworkClass.className}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-600">{getClassDayText(homeworkClass)} {homeworkClass.startTime} - {homeworkClass.endTime}</p>
                    <p className="mt-1 text-sm text-slate-500">{homeworkClass.classroomName} · 수강 학생 {homeworkClass.studentCount}명</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${classNotDoneCount > 0 ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
                    안해옴 {classNotDoneCount}건
                  </span>
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-bold text-slate-400">최근 숙제</p>
                  <p className="mt-1 font-bold text-slate-900">{latest?.title ?? "등록된 숙제 없음"}</p>
                  {latest ? <p className="mt-1 text-sm text-slate-500">기한 {formatDate(latest.dueDate)}</p> : null}
                </div>
                <Link href={`/teacher/homework/${homeworkClass.classId}`} className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800">
                  숙제 관리
                </Link>
              </article>
            );
          })}
        </section>
      </div>
    </TeacherShell>
  );
}

export function TeacherClassHomeworkPage({ classId }: { classId: string }) {
  const { accessToken } = useAuth();
  const numericClassId = Number(classId);
  const [homeworkClass, setHomeworkClass] = useState<TeacherHomeworkClass | null>(null);
  const [homeworks, setHomeworks] = useState<HomeworkSummary[]>([]);
  const [detail, setDetail] = useState<HomeworkDetail | null>(null);
  const [activeTab, setActiveTab] = useState<"assignments" | "students">("assignments");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<HomeworkStudentStatus | "ALL">("ALL");
  const [memoDrafts, setMemoDrafts] = useState<Record<number, string>>({});
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadDetail = useCallback(async (homeworkId: number) => {
    if (!accessToken || Number.isNaN(numericClassId)) return;
    const data = await getTeacherClassHomeworkDetail(numericClassId, homeworkId, accessToken);
    setDetail(data);
    setMemoDrafts(Object.fromEntries(data.students.map((item) => [item.homeworkStudentId, item.memo ?? ""])));
  }, [accessToken, numericClassId]);

  const load = useCallback(async () => {
    if (!accessToken || Number.isNaN(numericClassId)) return;
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [classes, homeworkData] = await Promise.all([
        getTeacherHomeworkClasses(accessToken),
        getTeacherClassHomeworks(numericClassId, accessToken),
      ]);
      const selectedClass = classes.find((item) => item.classId === numericClassId) ?? null;
      setHomeworkClass(selectedClass);
      setHomeworks(homeworkData);
      const nextId = homeworkData[0]?.homeworkId ?? null;
      setSelectedHomeworkId(nextId);
      if (nextId) await loadDetail(nextId);
      else setDetail(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, loadDetail, numericClassId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const selectHomework = async (homeworkId: number) => {
    setSelectedHomeworkId(homeworkId);
    setErrorMessage("");
    try {
      await loadDetail(homeworkId);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  const changeStatus = async (homeworkStudentId: number, status: HomeworkStudentStatus) => {
    if (!accessToken) return false;
    setProcessingId(homeworkStudentId);
    setErrorMessage("");
    try {
      const data = await updateTeacherHomeworkStudentStatus(
        homeworkStudentId,
        status,
        memoDrafts[homeworkStudentId] ?? "",
        accessToken,
      );
      setDetail(data);
      setHomeworks(await getTeacherClassHomeworks(numericClassId, accessToken));
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  const saveMemo = async (homeworkStudentId: number, status: HomeworkStudentStatus) => {
    if (await changeStatus(homeworkStudentId, status)) {
      setSuccessMessage("검사 메모가 저장되었습니다.");
    }
  };

  const removeHomework = async (homeworkId: number) => {
    if (!accessToken || !window.confirm("이 숙제를 삭제할까요?")) return;
    setErrorMessage("");
    try {
      await deleteTeacherClassHomework(numericClassId, homeworkId, accessToken);
      setSuccessMessage("숙제가 삭제되었습니다.");
      setSelectedHomeworkId(null);
      await load();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    }
  };

  if (!isLoading && !homeworkClass) {
    return <TeacherShell title="숙제 관리"><EmptyState title="수업을 찾을 수 없습니다." description="담당 수업 목록에서 다시 선택해 주세요." /></TeacherShell>;
  }

  const filteredStudents = detail?.students.filter((item) => statusFilter === "ALL" || item.status === statusFilter) ?? [];

  return (
    <TeacherShell title="숙제 관리">
      <div className="space-y-6">
        <Link href="/teacher/homework" className="inline-flex text-sm font-bold text-blue-700 hover:text-blue-900">← 수업 목록</Link>
        {errorMessage ? <ErrorNotice message={errorMessage} onRetry={load} /> : null}
        {successMessage ? <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">{successMessage}</p> : null}

        {homeworkClass ? (
          <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-blue-600">HOMEWORK</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{homeworkClass.className}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">{getClassDayText(homeworkClass)} {homeworkClass.startTime} - {homeworkClass.endTime}</p>
                <p className="mt-1 text-sm text-slate-500">{homeworkClass.classroomName} · 수강 학생 {homeworkClass.studentCount}명</p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(true)} disabled={homeworkClass.studentCount === 0} className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">숙제 등록</button>
            </div>
          </section>
        ) : null}

        {homeworkClass && homeworkClass.studentCount === 0 ? (
          <EmptyState title="수강 학생이 없어 숙제를 배정할 수 없습니다." description="학원에서 이 수업에 학생을 추가하면 숙제를 등록할 수 있습니다." />
        ) : null}

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5">
          <TabButton active={activeTab === "assignments"} onClick={() => setActiveTab("assignments")}>숙제 목록</TabButton>
          <TabButton active={activeTab === "students"} onClick={() => setActiveTab("students")}>학생별 확인</TabButton>
        </div>

        {activeTab === "assignments" ? (
          <HomeworkList homeworks={homeworks} onSelect={(id) => { void selectHomework(id); setActiveTab("students"); }} onDelete={(id) => void removeHomework(id)} />
        ) : (
          <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 className="text-lg font-bold text-slate-950">학생별 숙제 확인</h2><p className="mt-1 text-sm text-slate-600">해옴 또는 안해옴을 누르면 즉시 저장됩니다.</p></div>
              <div className="grid gap-2 sm:grid-cols-2">
                <select value={selectedHomeworkId ?? ""} onChange={(event) => void selectHomework(Number(event.target.value))} className={inputClass}>
                  <option value="" disabled>숙제 선택</option>
                  {homeworks.map((item) => <option key={item.homeworkId} value={item.homeworkId}>{item.title}</option>)}
                </select>
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as HomeworkStudentStatus | "ALL")} className={inputClass}>
                  <option value="ALL">전체 상태</option>
                  <option value="DONE">해옴</option>
                  <option value="NOT_DONE">안해옴</option>
                </select>
              </div>
            </div>
            {!detail ? <EmptyState title="확인할 숙제가 없습니다." description="숙제를 등록하면 학생별 상태를 확인할 수 있습니다." /> : null}
            <div className="mt-5 grid gap-4">
              {filteredStudents.map((student) => (
                <article key={student.homeworkStudentId} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><h3 className="font-bold text-slate-950">{student.studentName}</h3><p className="mt-1 text-sm font-semibold text-slate-600">{detail?.title}</p></div>
                    <HomeworkStatusBadge status={student.status} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <StatusButton active={student.status === "DONE"} tone="blue" disabled={processingId === student.homeworkStudentId} onClick={() => void changeStatus(student.homeworkStudentId, "DONE")}>해옴</StatusButton>
                    <StatusButton active={student.status === "NOT_DONE"} tone="red" disabled={processingId === student.homeworkStudentId} onClick={() => void changeStatus(student.homeworkStudentId, "NOT_DONE")}>안해옴</StatusButton>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input value={memoDrafts[student.homeworkStudentId] ?? ""} onChange={(event) => setMemoDrafts((current) => ({ ...current, [student.homeworkStudentId]: event.target.value }))} placeholder="검사 메모" className={inputClass} />
                    <button type="button" onClick={() => void saveMemo(student.homeworkStudentId, student.status)} className="h-11 shrink-0 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">메모 저장</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {isCreateOpen && homeworkClass ? (
        <HomeworkCreateModal
          homeworkClass={homeworkClass}
          onClose={() => setIsCreateOpen(false)}
          onSave={async (payload) => {
            if (!accessToken) return;
            await createTeacherClassHomework(homeworkClass.classId, payload, accessToken);
            setIsCreateOpen(false);
            setSuccessMessage("숙제가 등록되었습니다.");
            await load();
          }}
        />
      ) : null}
    </TeacherShell>
  );
}

function HomeworkList({ homeworks, onSelect, onDelete }: { homeworks: HomeworkSummary[]; onSelect: (id: number) => void; onDelete: (id: number) => void }) {
  if (homeworks.length === 0) return <EmptyState title="아직 등록된 숙제가 없습니다." description="숙제 등록 버튼으로 첫 숙제를 만들어 주세요." />;
  return <section className="grid gap-4 lg:grid-cols-2">{homeworks.map((item) => (
    <article key={item.homeworkId} className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold text-slate-950">{item.title}</h3><p className="mt-1 text-sm text-slate-500">기한 {formatDate(item.dueDate)} · {item.targetType === "CLASS" ? "수업 전체" : "개별 학생"}</p></div>{item.dueDate < toDateKey(new Date()) && item.notDoneCount > 0 ? <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">기한 지남</span> : null}</div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{item.content}</p>
      <div className="mt-4 grid grid-cols-3 gap-2"><Metric label="배정" value={`${item.assignedCount}명`} /><Metric label="해옴" value={`${item.doneCount}명`} /><Metric label="안해옴" value={`${item.notDoneCount}명`} danger={item.notDoneCount > 0} /></div>
      <div className="mt-4 flex flex-wrap gap-2"><ActionButton onClick={() => onSelect(item.homeworkId)}>학생별 확인</ActionButton><button type="button" onClick={() => onDelete(item.homeworkId)} className="h-10 rounded-2xl border border-red-100 bg-white px-4 text-sm font-bold text-red-600">삭제</button></div>
    </article>
  ))}</section>;
}

function HomeworkCreateModal({ homeworkClass, onClose, onSave }: { homeworkClass: TeacherHomeworkClass; onClose: () => void; onSave: (payload: HomeworkCreateRequest) => Promise<void> }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState(toDateKey(new Date()));
  const [targetType, setTargetType] = useState<HomeworkTargetType>("CLASS");
  const [studentProfileIds, setStudentProfileIds] = useState<number[]>([]);
  const [memo, setMemo] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const filteredStudents = homeworkClass.students.filter((student) => student.studentName.includes(search.trim()));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !content.trim() || !dueDate) return setError("숙제 제목, 내용, 기한을 모두 입력해 주세요.");
    if (targetType === "INDIVIDUAL" && studentProfileIds.length === 0) return setError("학생을 한 명 이상 선택해 주세요.");
    setIsSaving(true);
    setError("");
    try {
      await onSave({ title: title.trim(), content: content.trim(), dueDate, targetType, studentProfileIds: targetType === "CLASS" ? [] : studentProfileIds, memo: memo.trim() || null });
    } catch (saveError) {
      setError(getErrorMessage(saveError));
      setIsSaving(false);
    }
  };

  return <Modal title="숙제 등록" description={`${homeworkClass.className} 숙제를 배정합니다.`} onClose={onClose}>
    <form onSubmit={(event) => void submit(event)} className="grid gap-4">
      {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
      <FormField label="숙제 제목"><input value={title} onChange={(event) => setTitle(event.target.value)} className={inputClass} /></FormField>
      <FormField label="숙제 내용"><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className={`${inputClass} h-auto py-3`} /></FormField>
      <FormField label="기한"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} /></FormField>
      <fieldset><legend className="text-sm font-bold text-slate-700">대상</legend><div className="mt-2 grid grid-cols-2 gap-2"><TargetButton active={targetType === "CLASS"} onClick={() => setTargetType("CLASS")}>수업 전체</TargetButton><TargetButton active={targetType === "INDIVIDUAL"} onClick={() => setTargetType("INDIVIDUAL")}>특정 학생</TargetButton></div></fieldset>
      {targetType === "CLASS" ? <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">ACTIVE 수강 학생 전체 {homeworkClass.studentCount}명에게 안해옴 상태로 배정됩니다.</p> : <div className="rounded-2xl border border-slate-200 p-4"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="학생 이름 검색" className={inputClass} /><div className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">{filteredStudents.map((student) => { const selected = studentProfileIds.includes(student.studentProfileId); return <label key={student.studentProfileId} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${selected ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-700"}`}><input type="checkbox" checked={selected} onChange={() => setStudentProfileIds((current) => selected ? current.filter((id) => id !== student.studentProfileId) : [...current, student.studentProfileId])} className="h-5 w-5 accent-blue-700" />{student.studentName}</label>; })}</div></div>}
      <FormField label="메모"><textarea value={memo} onChange={(event) => setMemo(event.target.value)} rows={3} className={`${inputClass} h-auto py-3`} /></FormField>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700">취소</button><button type="submit" disabled={isSaving} className="h-11 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white disabled:bg-slate-400">{isSaving ? "등록 중" : "숙제 등록"}</button></div>
    </form>
  </Modal>;
}

function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) { return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 sm:items-center sm:p-4"><section className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl"><div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4"><div><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm text-slate-600">{description}</p></div><button type="button" onClick={onClose} className="h-10 w-10 rounded-2xl border border-slate-200 text-lg font-bold" aria-label="닫기">×</button></div><div className="p-5 sm:p-6">{children}</div></section></div>; }
function SummaryCard({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><p className="text-sm font-semibold text-slate-500">{label}</p><p className={`mt-3 text-2xl font-black ${emphasis ? "text-red-600" : "text-slate-950"}`}>{value}</p></div>; }
function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) { return <div className="rounded-2xl bg-slate-50 px-3 py-3"><p className="text-xs font-bold text-slate-400">{label}</p><p className={`mt-1 text-sm font-black ${danger ? "text-red-600" : "text-slate-900"}`}>{value}</p></div>; }
function HomeworkStatusBadge({ status }: { status: HomeworkStudentStatus }) { return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${homeworkStatusStyles[status]}`}>{homeworkStatusLabels[status]}</span>; }
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className={`h-11 rounded-xl text-sm font-bold ${active ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>{children}</button>; }
function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className="h-10 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700">{children}</button>; }
function StatusButton({ active, tone, disabled, onClick, children }: { active: boolean; tone: "blue" | "red"; disabled: boolean; onClick: () => void; children: ReactNode }) { const color = tone === "blue" ? (active ? "border-blue-700 bg-blue-700 text-white" : "border-blue-100 bg-white text-blue-700") : (active ? "border-red-600 bg-red-600 text-white" : "border-red-100 bg-white text-red-600"); return <button type="button" disabled={disabled} onClick={onClick} className={`h-14 rounded-2xl border px-4 text-base font-black disabled:opacity-60 ${color}`}>{children}</button>; }
function TargetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className={`h-11 rounded-2xl border text-sm font-bold ${active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{children}</button>; }
function FormField({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-2"><span className="text-sm font-bold text-slate-700">{label}</span>{children}</label>; }
function EmptyState({ title, description }: { title: string; description: string }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center"><h2 className="text-lg font-bold text-slate-950">{title}</h2><p className="mt-2 text-sm text-slate-600">{description}</p></div>; }
function ErrorNotice({ message, onRetry }: { message: string; onRetry: () => void | Promise<void> }) { return <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3"><p className="text-sm font-bold text-red-600">{message}</p><button type="button" onClick={() => void onRetry()} className="mt-2 text-sm font-bold text-red-700 underline">다시 시도</button></div>; }
function getClassDayText(homeworkClass: TeacherHomeworkClass) { return homeworkClass.dayLabels?.length ? homeworkClass.dayLabels.join(", ") : homeworkClass.dayLabel; }
function getErrorMessage(error: unknown) { return error instanceof ApiError ? error.message : "요청을 처리하지 못했습니다."; }
function toDateKey(date: Date) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }
function addDays(value: string, days: number) { const date = new Date(`${value}T00:00:00`); date.setDate(date.getDate() + days); return toDateKey(date); }
function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${value}T00:00:00`)); }
const inputClass = "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
