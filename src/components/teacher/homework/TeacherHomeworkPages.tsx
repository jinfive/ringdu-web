"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { TeacherShell } from "@/components/teacher/TeacherPages";
import {
  homeworkStatusLabels,
  homeworkStatusStyles,
  type HomeworkAssignment,
  type HomeworkClass,
  type HomeworkStatus,
  type HomeworkStudentStatus,
  type HomeworkTargetType,
} from "@/types/homework";

const HOMEWORK_STORAGE_KEY = "ringdu:teacher-homework-ui";

const mockClasses: HomeworkClass[] = [
  {
    classId: 1,
    className: "중등수학 A반",
    dayLabel: "월·수",
    startTime: "17:00",
    endTime: "18:30",
    classroomName: "3강의실",
    students: [
      { studentProfileId: 101, studentName: "김학생" },
      { studentProfileId: 102, studentName: "이학생" },
      { studentProfileId: 103, studentName: "박학생" },
      { studentProfileId: 104, studentName: "최학생" },
    ],
  },
  {
    classId: 2,
    className: "고등수학 심화반",
    dayLabel: "화·목",
    startTime: "19:00",
    endTime: "21:00",
    classroomName: "1강의실",
    students: [
      { studentProfileId: 201, studentName: "정학생" },
      { studentProfileId: 202, studentName: "한학생" },
      { studentProfileId: 203, studentName: "윤학생" },
    ],
  },
  {
    classId: 3,
    className: "중등수학 B반",
    dayLabel: "금",
    startTime: "18:00",
    endTime: "20:00",
    classroomName: "2강의실",
    students: [
      { studentProfileId: 301, studentName: "오학생" },
      { studentProfileId: 302, studentName: "강학생" },
      { studentProfileId: 303, studentName: "서학생" },
      { studentProfileId: 304, studentName: "임학생" },
      { studentProfileId: 305, studentName: "신학생" },
    ],
  },
];

const initialAssignments: HomeworkAssignment[] = [
  {
    homeworkId: 1,
    classId: 1,
    className: "중등수학 A반",
    title: "일차함수 유형 문제",
    content: "개념원리 p.30~35 문제를 풀고 틀린 문제에 표시하기",
    dueDate: "2026-06-12",
    targetType: "CLASS",
    targetStudentIds: [101, 102, 103, 104],
    memo: "풀이 과정을 반드시 적어 주세요.",
    createdAt: "2026-06-09T10:00:00",
  },
  {
    homeworkId: 2,
    classId: 1,
    className: "중등수학 A반",
    title: "오답노트 추가 정리",
    content: "지난 단원평가 오답 중 3문제를 다시 풀기",
    dueDate: "2026-06-10",
    targetType: "INDIVIDUAL",
    targetStudentIds: [102, 104],
    memo: "개별 보충 숙제",
    createdAt: "2026-06-08T18:00:00",
  },
  {
    homeworkId: 3,
    classId: 2,
    className: "고등수학 심화반",
    title: "수열 심화 문제",
    content: "프린트 2장 전체 풀이",
    dueDate: "2026-06-13",
    targetType: "CLASS",
    targetStudentIds: [201, 202, 203],
    createdAt: "2026-06-10T20:30:00",
  },
];

const initialStatuses: HomeworkStudentStatus[] = [
  { homeworkId: 1, studentProfileId: 101, studentName: "김학생", status: "DONE" },
  { homeworkId: 1, studentProfileId: 102, studentName: "이학생", status: "ASSIGNED" },
  { homeworkId: 1, studentProfileId: 103, studentName: "박학생", status: "CHECKED", memo: "풀이 양호" },
  { homeworkId: 1, studentProfileId: 104, studentName: "최학생", status: "NOT_DONE", memo: "다음 수업까지 보완" },
  { homeworkId: 2, studentProfileId: 102, studentName: "이학생", status: "DONE" },
  { homeworkId: 2, studentProfileId: 104, studentName: "최학생", status: "ASSIGNED" },
  { homeworkId: 3, studentProfileId: 201, studentName: "정학생", status: "ASSIGNED" },
  { homeworkId: 3, studentProfileId: 202, studentName: "한학생", status: "ASSIGNED" },
  { homeworkId: 3, studentProfileId: 203, studentName: "윤학생", status: "ASSIGNED" },
];

type HomeworkStore = {
  assignments: HomeworkAssignment[];
  statuses: HomeworkStudentStatus[];
};

export function TeacherHomeworkPage() {
  const store = useHomeworkStore();
  const today = toDateKey(new Date());
  const weekEnd = addDays(today, 7);
  const activeStatuses = store.statuses.filter((status) => {
    const homework = store.assignments.find((item) => item.homeworkId === status.homeworkId);
    return homework && homework.dueDate <= today && status.status !== "CHECKED";
  });
  const incompleteCount = new Set(
    store.statuses.filter((status) => status.status === "NOT_DONE").map((status) => status.studentProfileId),
  ).size;
  const weeklyCount = store.assignments.filter((homework) => homework.dueDate >= today && homework.dueDate <= weekEnd).length;

  return (
    <TeacherShell title="숙제 관리">
      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-black text-slate-950">숙제 관리</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">담당 수업의 숙제를 등록하고 학생별 수행 여부를 검사합니다.</p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="오늘 확인할 숙제" value={`${activeStatuses.length}건`} emphasis={activeStatuses.length > 0} />
          <SummaryCard label="미확인 숙제" value={`${store.statuses.filter((item) => item.status === "ASSIGNED" || item.status === "DONE").length}건`} />
          <SummaryCard label="미완료 학생" value={`${incompleteCount}명`} emphasis={incompleteCount > 0} />
          <SummaryCard label="이번 주 숙제" value={`${weeklyCount}건`} />
        </div>

        <section className="grid gap-4 lg:grid-cols-2">
          {mockClasses.map((homeworkClass) => {
            const assignments = store.assignments.filter((item) => item.classId === homeworkClass.classId);
            const latest = [...assignments].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
            const homeworkIds = new Set(assignments.map((item) => item.homeworkId));
            const unchecked = store.statuses.filter((item) => homeworkIds.has(item.homeworkId) && item.status !== "CHECKED").length;
            return (
              <article key={homeworkClass.classId} className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-950">{homeworkClass.className}</h3>
                    <p className="mt-2 text-sm font-semibold text-slate-600">{homeworkClass.dayLabel} {homeworkClass.startTime} - {homeworkClass.endTime}</p>
                    <p className="mt-1 text-sm text-slate-500">{homeworkClass.classroomName} · 수강 학생 {homeworkClass.students.length}명</p>
                  </div>
                  <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${unchecked > 0 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                    미확인 {unchecked}건
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
  const numericClassId = Number(classId);
  const homeworkClass = mockClasses.find((item) => item.classId === numericClassId);
  const store = useHomeworkStore();
  const [activeTab, setActiveTab] = useState<"assignments" | "students">("assignments");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHomework, setEditingHomework] = useState<HomeworkAssignment | null>(null);
  const [detailHomework, setDetailHomework] = useState<HomeworkAssignment | null>(null);
  const [selectedHomeworkId, setSelectedHomeworkId] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<HomeworkStatus | "ALL">("ALL");

  if (!homeworkClass) {
    return (
      <TeacherShell title="숙제 관리">
        <EmptyState title="수업을 찾을 수 없습니다." description="숙제 관리 목록에서 담당 수업을 다시 선택해 주세요." />
      </TeacherShell>
    );
  }

  const assignments = store.assignments.filter((item) => item.classId === homeworkClass.classId);
  const assignmentIds = new Set(assignments.map((item) => item.homeworkId));
  const filteredStatuses = store.statuses.filter((item) => {
    if (!assignmentIds.has(item.homeworkId)) return false;
    if (selectedHomeworkId !== "ALL" && item.homeworkId !== Number(selectedHomeworkId)) return false;
    return statusFilter === "ALL" || item.status === statusFilter;
  });

  return (
    <TeacherShell title="숙제 관리">
      <div className="space-y-6">
        <Link href="/teacher/homework" className="inline-flex text-sm font-bold text-blue-700 hover:text-blue-900">← 수업 목록</Link>
        <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-xl shadow-slate-200/60">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-blue-600">HOMEWORK</p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{homeworkClass.className}</h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">{homeworkClass.dayLabel} {homeworkClass.startTime} - {homeworkClass.endTime}</p>
              <p className="mt-1 text-sm text-slate-500">{homeworkClass.classroomName} · 수강 학생 {homeworkClass.students.length}명</p>
            </div>
            <button type="button" onClick={() => setIsCreateOpen(true)} className="inline-flex h-12 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-800">
              숙제 등록
            </button>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <TabButton active={activeTab === "assignments"} onClick={() => setActiveTab("assignments")}>숙제 목록</TabButton>
            <TabButton active={activeTab === "students"} onClick={() => setActiveTab("students")}>학생별 확인</TabButton>
          </div>
        </section>

        {activeTab === "assignments" ? (
          <AssignmentList
            assignments={assignments}
            statuses={store.statuses}
            onDetail={setDetailHomework}
            onEdit={setEditingHomework}
            onDelete={(homeworkId) => store.deleteAssignment(homeworkId)}
          />
        ) : (
          <StudentCheckList
            assignments={assignments}
            statuses={filteredStatuses}
            selectedHomeworkId={selectedHomeworkId}
            statusFilter={statusFilter}
            onHomeworkFilter={setSelectedHomeworkId}
            onStatusFilter={setStatusFilter}
            onStatusChange={store.updateStatus}
            onMemoChange={store.updateMemo}
          />
        )}
      </div>

      {isCreateOpen ? (
        <HomeworkCreateModal
          homeworkClass={homeworkClass}
          onClose={() => setIsCreateOpen(false)}
          onSave={(draft) => {
            store.createAssignment(homeworkClass, draft);
            setIsCreateOpen(false);
          }}
        />
      ) : null}
      {editingHomework ? (
        <HomeworkCreateModal
          homeworkClass={homeworkClass}
          assignment={editingHomework}
          onClose={() => setEditingHomework(null)}
          onSave={(draft) => {
            store.updateAssignment(editingHomework.homeworkId, homeworkClass, draft);
            setEditingHomework(null);
          }}
        />
      ) : null}
      {detailHomework ? <HomeworkDetailModal assignment={detailHomework} statuses={store.statuses} onClose={() => setDetailHomework(null)} /> : null}
    </TeacherShell>
  );
}

type AssignmentDraft = {
  title: string;
  content: string;
  dueDate: string;
  targetType: HomeworkTargetType;
  targetStudentIds: number[];
  memo: string;
};

function AssignmentList({
  assignments,
  statuses,
  onDetail,
  onEdit,
  onDelete,
}: {
  assignments: HomeworkAssignment[];
  statuses: HomeworkStudentStatus[];
  onDetail: (assignment: HomeworkAssignment) => void;
  onEdit: (assignment: HomeworkAssignment) => void;
  onDelete: (homeworkId: number) => void;
}) {
  if (assignments.length === 0) {
    return <EmptyState title="등록된 숙제가 없습니다." description="숙제 등록 버튼을 눌러 첫 숙제를 배정해 주세요." />;
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {[...assignments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((assignment) => {
        const studentStatuses = statuses.filter((item) => item.homeworkId === assignment.homeworkId);
        const checkedCount = studentStatuses.filter((item) => item.status === "CHECKED").length;
        const doneCount = studentStatuses.filter((item) => item.status === "DONE").length;
        const notDoneCount = studentStatuses.filter((item) => item.status === "NOT_DONE").length;
        const status = getAssignmentDisplayStatus(assignment, studentStatuses);
        return (
          <article key={assignment.homeworkId} className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl shadow-slate-200/60">
            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-bold text-slate-950">{assignment.title}</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">{assignment.targetType === "CLASS" ? "수업 전체" : "개별 학생"} · 기한 {formatDate(assignment.dueDate)}</p>
                </div>
                <AssignmentBadge status={status} />
              </div>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{assignment.content}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Metric label="배정" value={`${studentStatuses.length}명`} />
                <Metric label="해옴" value={`${doneCount}명`} />
                <Metric label="미완료" value={`${notDoneCount}명`} danger={notDoneCount > 0} />
                <Metric label="확인 완료" value={`${checkedCount}명`} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
              <ActionButton onClick={() => onDetail(assignment)}>상세 보기</ActionButton>
              <ActionButton onClick={() => onEdit(assignment)}>수정</ActionButton>
              <button type="button" onClick={() => window.confirm("이 숙제를 삭제할까요?") && onDelete(assignment.homeworkId)} className="h-10 flex-1 rounded-2xl border border-red-100 bg-white px-4 text-sm font-bold text-red-600 hover:bg-red-50">삭제</button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function StudentCheckList({
  assignments,
  statuses,
  selectedHomeworkId,
  statusFilter,
  onHomeworkFilter,
  onStatusFilter,
  onStatusChange,
  onMemoChange,
}: {
  assignments: HomeworkAssignment[];
  statuses: HomeworkStudentStatus[];
  selectedHomeworkId: string;
  statusFilter: HomeworkStatus | "ALL";
  onHomeworkFilter: (value: string) => void;
  onStatusFilter: (value: HomeworkStatus | "ALL") => void;
  onStatusChange: (homeworkId: number, studentProfileId: number, status: HomeworkStatus) => void;
  onMemoChange: (homeworkId: number, studentProfileId: number, memo: string) => void;
}) {
  return (
    <section className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-950">학생별 숙제 확인</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">검사 결과를 누르면 상태가 즉시 반영됩니다.</p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <FilterField label="숙제 선택">
          <select value={selectedHomeworkId} onChange={(event) => onHomeworkFilter(event.target.value)} className={inputClass}>
            <option value="ALL">전체 숙제</option>
            {assignments.map((assignment) => <option key={assignment.homeworkId} value={assignment.homeworkId}>{assignment.title}</option>)}
          </select>
        </FilterField>
        <FilterField label="상태 선택">
          <select value={statusFilter} onChange={(event) => onStatusFilter(event.target.value as HomeworkStatus | "ALL")} className={inputClass}>
            <option value="ALL">전체 상태</option>
            {(Object.keys(homeworkStatusLabels) as HomeworkStatus[]).map((status) => <option key={status} value={status}>{homeworkStatusLabels[status]}</option>)}
          </select>
        </FilterField>
      </div>

      {statuses.length === 0 ? (
        <EmptyState title="조건에 맞는 학생이 없습니다." description="숙제 또는 상태 필터를 변경해 주세요." />
      ) : (
        <div className="mt-5 grid gap-4">
          {statuses.map((studentStatus) => {
            const assignment = assignments.find((item) => item.homeworkId === studentStatus.homeworkId);
            if (!assignment) return null;
            return (
              <article key={`${studentStatus.homeworkId}-${studentStatus.studentProfileId}`} className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-950">{studentStatus.studentName}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">{assignment.title}</p>
                    <p className="mt-1 text-xs text-slate-500">기한 {formatDate(assignment.dueDate)}</p>
                  </div>
                  <HomeworkStatusBadge status={studentStatus.status} />
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <StatusButton active={studentStatus.status === "DONE"} tone="blue" onClick={() => onStatusChange(studentStatus.homeworkId, studentStatus.studentProfileId, "DONE")}>해옴</StatusButton>
                  <StatusButton active={studentStatus.status === "NOT_DONE"} tone="red" onClick={() => onStatusChange(studentStatus.homeworkId, studentStatus.studentProfileId, "NOT_DONE")}>안 해옴</StatusButton>
                  <StatusButton active={studentStatus.status === "CHECKED"} tone="green" onClick={() => onStatusChange(studentStatus.homeworkId, studentStatus.studentProfileId, "CHECKED")}>확인 완료</StatusButton>
                </div>
                <label className="mt-4 block">
                  <span className="text-xs font-bold text-slate-500">검사 메모</span>
                  <input value={studentStatus.memo ?? ""} onChange={(event) => onMemoChange(studentStatus.homeworkId, studentStatus.studentProfileId, event.target.value)} placeholder="보완할 내용이나 확인 메모" className={`${inputClass} mt-2`} />
                </label>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function HomeworkCreateModal({
  homeworkClass,
  assignment,
  onClose,
  onSave,
}: {
  homeworkClass: HomeworkClass;
  assignment?: HomeworkAssignment;
  onClose: () => void;
  onSave: (draft: AssignmentDraft) => void;
}) {
  const [title, setTitle] = useState(assignment?.title ?? "");
  const [content, setContent] = useState(assignment?.content ?? "");
  const [dueDate, setDueDate] = useState(assignment?.dueDate ?? toDateKey(new Date()));
  const [targetType, setTargetType] = useState<HomeworkTargetType>(assignment?.targetType ?? "CLASS");
  const [targetStudentIds, setTargetStudentIds] = useState<number[]>(assignment?.targetStudentIds ?? []);
  const [memo, setMemo] = useState(assignment?.memo ?? "");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const filteredStudents = homeworkClass.students.filter((student) => student.studentName.includes(search.trim()));

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const resolvedStudentIds = targetType === "CLASS" ? homeworkClass.students.map((student) => student.studentProfileId) : targetStudentIds;
    if (!title.trim() || !content.trim() || !dueDate) {
      setError("숙제 제목, 내용, 기한을 모두 입력해 주세요.");
      return;
    }
    if (targetType === "INDIVIDUAL" && resolvedStudentIds.length === 0) {
      setError("숙제를 배정할 학생을 한 명 이상 선택해 주세요.");
      return;
    }
    onSave({ title: title.trim(), content: content.trim(), dueDate, targetType, targetStudentIds: resolvedStudentIds, memo: memo.trim() });
  };

  return (
    <Modal title={assignment ? "숙제 수정" : "숙제 등록"} description={`${homeworkClass.className} 숙제를 배정합니다.`} onClose={onClose}>
      <form onSubmit={submit} className="grid gap-4">
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">{error}</p> : null}
        <FormField label="숙제 제목"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 일차함수 유형 문제" className={inputClass} /></FormField>
        <FormField label="숙제 내용"><textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} placeholder="예: 개념원리 p.30~35 풀기" className={`${inputClass} h-auto py-3`} /></FormField>
        <FormField label="기한"><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className={inputClass} /></FormField>
        <fieldset>
          <legend className="text-sm font-bold text-slate-700">대상</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <TargetButton active={targetType === "CLASS"} onClick={() => setTargetType("CLASS")}>수업 전체</TargetButton>
            <TargetButton active={targetType === "INDIVIDUAL"} onClick={() => setTargetType("INDIVIDUAL")}>특정 학생</TargetButton>
          </div>
        </fieldset>
        {targetType === "CLASS" ? (
          <p className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">수강 학생 전체 {homeworkClass.students.length}명에게 배정됩니다.</p>
        ) : (
          <div className="rounded-2xl border border-slate-200 p-4">
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="학생 이름 검색" className={inputClass} />
            <div className="mt-3 grid max-h-52 gap-2 overflow-y-auto sm:grid-cols-2">
              {filteredStudents.map((student) => {
                const selected = targetStudentIds.includes(student.studentProfileId);
                return (
                  <label key={student.studentProfileId} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${selected ? "border-blue-300 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700"}`}>
                    <input type="checkbox" checked={selected} onChange={() => setTargetStudentIds((current) => selected ? current.filter((id) => id !== student.studentProfileId) : [...current, student.studentProfileId])} className="h-5 w-5 accent-blue-700" />
                    {student.studentName}
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-xs font-bold text-slate-500">선택 {targetStudentIds.length}명</p>
          </div>
        )}
        <FormField label="메모"><textarea value={memo} onChange={(event) => setMemo(event.target.value)} rows={3} placeholder="선생님용 안내 또는 추가 설명" className={`${inputClass} h-auto py-3`} /></FormField>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-2xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700">취소</button>
          <button type="submit" className="h-11 rounded-2xl bg-blue-700 px-5 text-sm font-bold text-white">{assignment ? "수정 저장" : "숙제 등록"}</button>
        </div>
      </form>
    </Modal>
  );
}

function HomeworkDetailModal({ assignment, statuses, onClose }: { assignment: HomeworkAssignment; statuses: HomeworkStudentStatus[]; onClose: () => void }) {
  const assigned = statuses.filter((item) => item.homeworkId === assignment.homeworkId);
  return (
    <Modal title={assignment.title} description={`${assignment.className} · 기한 ${formatDate(assignment.dueDate)}`} onClose={onClose}>
      <div className="grid gap-4">
        <DetailValue label="대상" value={assignment.targetType === "CLASS" ? `수업 전체 ${assigned.length}명` : `개별 학생 ${assigned.length}명`} />
        <DetailValue label="숙제 내용" value={assignment.content} />
        <DetailValue label="메모" value={assignment.memo || "메모 없음"} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(Object.keys(homeworkStatusLabels) as HomeworkStatus[]).map((status) => <Metric key={status} label={homeworkStatusLabels[status]} value={`${assigned.filter((item) => item.status === status).length}명`} danger={status === "NOT_DONE"} />)}
        </div>
      </div>
    </Modal>
  );
}

function useHomeworkStore() {
  const [store, setStore] = useState<HomeworkStore>({ assignments: initialAssignments, statuses: initialStatuses });

  useEffect(() => {
    void Promise.resolve().then(() => {
      const saved = window.localStorage.getItem(HOMEWORK_STORAGE_KEY);
      if (!saved) return;
      try {
        setStore(JSON.parse(saved) as HomeworkStore);
      } catch {
        window.localStorage.removeItem(HOMEWORK_STORAGE_KEY);
      }
    });
  }, []);

  const save = (next: HomeworkStore) => {
    setStore(next);
    window.localStorage.setItem(HOMEWORK_STORAGE_KEY, JSON.stringify(next));
  };

  const createAssignment = (homeworkClass: HomeworkClass, draft: AssignmentDraft) => {
    const homeworkId = Math.max(0, ...store.assignments.map((item) => item.homeworkId)) + 1;
    const assignment: HomeworkAssignment = { homeworkId, classId: homeworkClass.classId, className: homeworkClass.className, ...draft, createdAt: new Date().toISOString() };
    const statuses = homeworkClass.students
      .filter((student) => draft.targetStudentIds.includes(student.studentProfileId))
      .map((student) => ({ homeworkId, studentProfileId: student.studentProfileId, studentName: student.studentName, status: "ASSIGNED" as const }));
    save({ assignments: [...store.assignments, assignment], statuses: [...store.statuses, ...statuses] });
  };

  const updateAssignment = (homeworkId: number, homeworkClass: HomeworkClass, draft: AssignmentDraft) => {
    const previousStatuses = store.statuses.filter((item) => item.homeworkId === homeworkId);
    const statuses = homeworkClass.students
      .filter((student) => draft.targetStudentIds.includes(student.studentProfileId))
      .map((student) => previousStatuses.find((item) => item.studentProfileId === student.studentProfileId) ?? ({ homeworkId, studentProfileId: student.studentProfileId, studentName: student.studentName, status: "ASSIGNED" as const }));
    save({
      assignments: store.assignments.map((item) => item.homeworkId === homeworkId ? { ...item, ...draft } : item),
      statuses: [...store.statuses.filter((item) => item.homeworkId !== homeworkId), ...statuses],
    });
  };

  const deleteAssignment = (homeworkId: number) => save({
    assignments: store.assignments.filter((item) => item.homeworkId !== homeworkId),
    statuses: store.statuses.filter((item) => item.homeworkId !== homeworkId),
  });

  const updateStatus = (homeworkId: number, studentProfileId: number, status: HomeworkStatus) => save({
    ...store,
    statuses: store.statuses.map((item) => item.homeworkId === homeworkId && item.studentProfileId === studentProfileId ? { ...item, status } : item),
  });

  const updateMemo = (homeworkId: number, studentProfileId: number, memo: string) => save({
    ...store,
    statuses: store.statuses.map((item) => item.homeworkId === homeworkId && item.studentProfileId === studentProfileId ? { ...item, memo } : item),
  });

  return { ...store, createAssignment, updateAssignment, deleteAssignment, updateStatus, updateMemo };
}

function Modal({ title, description, onClose, children }: { title: string; description: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 sm:items-center sm:p-4">
      <section className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div><h2 className="text-xl font-black text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></div>
          <button type="button" onClick={onClose} className="h-10 w-10 shrink-0 rounded-2xl border border-slate-200 text-lg font-bold text-slate-600" aria-label="닫기">×</button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </section>
    </div>
  );
}

function SummaryCard({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) { return <div className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-200/60"><p className="text-sm font-semibold text-slate-500">{label}</p><p className={`mt-3 text-2xl font-black ${emphasis ? "text-red-600" : "text-slate-950"}`}>{value}</p></div>; }
function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) { return <div className="rounded-2xl bg-slate-50 px-3 py-3"><p className="text-xs font-bold text-slate-400">{label}</p><p className={`mt-1 text-sm font-black ${danger ? "text-red-600" : "text-slate-900"}`}>{value}</p></div>; }
function HomeworkStatusBadge({ status }: { status: HomeworkStatus }) { return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${homeworkStatusStyles[status]}`}>{homeworkStatusLabels[status]}</span>; }
function AssignmentBadge({ status }: { status: "ACTIVE" | "OVERDUE" | "COMPLETE" }) { const config = { ACTIVE: ["진행 중", "bg-blue-50 text-blue-700"], OVERDUE: ["기한 지남", "bg-red-50 text-red-700"], COMPLETE: ["확인 완료", "bg-emerald-50 text-emerald-700"] }[status]; return <span className={`rounded-full px-3 py-1 text-xs font-bold ${config[1]}`}>{config[0]}</span>; }
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className={`h-11 rounded-xl text-sm font-bold transition ${active ? "bg-white text-blue-700 shadow-sm" : "text-slate-500"}`}>{children}</button>; }
function ActionButton({ onClick, children }: { onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className="h-10 flex-1 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700">{children}</button>; }
function StatusButton({ active, tone, onClick, children }: { active: boolean; tone: "blue" | "red" | "green"; onClick: () => void; children: ReactNode }) { const colors = { blue: active ? "border-blue-700 bg-blue-700 text-white" : "border-blue-100 bg-white text-blue-700", red: active ? "border-red-600 bg-red-600 text-white" : "border-red-100 bg-white text-red-600", green: active ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-100 bg-white text-emerald-700" }; return <button type="button" onClick={onClick} className={`h-12 rounded-2xl border px-4 text-sm font-black transition ${colors[tone]}`}>{children}</button>; }
function TargetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) { return <button type="button" onClick={onClick} className={`h-11 rounded-2xl border text-sm font-bold ${active ? "border-blue-700 bg-blue-700 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{children}</button>; }
function FilterField({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="text-sm font-bold text-slate-700">{label}</span><div className="mt-2">{children}</div></label>; }
function FormField({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-2"><span className="text-sm font-bold text-slate-700">{label}</span>{children}</label>; }
function DetailValue({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl bg-slate-50 px-4 py-3"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 whitespace-pre-line text-sm font-semibold leading-6 text-slate-800">{value}</p></div>; }
function EmptyState({ title, description }: { title: string; description: string }) { return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-10 text-center"><h2 className="text-lg font-bold text-slate-950">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{description}</p></div>; }

function getAssignmentDisplayStatus(assignment: HomeworkAssignment, statuses: HomeworkStudentStatus[]) { if (statuses.length > 0 && statuses.every((item) => item.status === "CHECKED")) return "COMPLETE" as const; if (assignment.dueDate < toDateKey(new Date())) return "OVERDUE" as const; return "ACTIVE" as const; }
function toDateKey(date: Date) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 10); }
function addDays(value: string, days: number) { const date = new Date(`${value}T00:00:00`); date.setDate(date.getDate() + days); return toDateKey(date); }
function formatDate(value: string) { return new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${value}T00:00:00`)); }
const inputClass = "h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100";
