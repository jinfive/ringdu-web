"use client";

import { useState } from "react";
import {
  ApiError,
  createAcademyStudent,
  createAcademyStudentInvitation,
  searchAccountCandidates,
} from "@/lib/api";
import type { AcademyStudentCreateRequest, CandidateDto } from "@/types/auth";

type CandidateRole = "STUDENT" | "PARENT";
type RegistrationStep = 1 | 2 | 3;

export function AcademyStudentRegistrationModal({
  accessToken,
  onClose,
  onCompleted,
}: {
  accessToken: string | null;
  onClose: () => void;
  onCompleted: () => void;
}) {
  const [form, setForm] = useState<AcademyStudentCreateRequest>(initialStudentForm);
  const [isSending, setIsSending] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [candidates, setCandidates] = useState<CandidateDto[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [step, setStep] = useState<RegistrationStep>(1);
  const [candidateRole, setCandidateRole] = useState<CandidateRole>("STUDENT");
  const [candidateNotice, setCandidateNotice] = useState("");

  const handleSearch = async () => {
    if (!accessToken) return;

    const phone = form.phone?.trim();
    const guardianPhone = form.guardianPhone?.trim();
    const nextCandidateRole: CandidateRole = phone ? "STUDENT" : "PARENT";
    const searchPhone = phone || guardianPhone;

    if (!searchPhone) {
      setErrorMessage("기존 계정을 확인하려면 학생 전화번호 또는 보호자 전화번호를 입력해 주세요.");
      return;
    }

    setIsSearching(true);
    setErrorMessage("");
    setCandidates([]);
    setSuccessMessage("");
    setCandidateRole(nextCandidateRole);
    setCandidateNotice(phone ? "" : "학생 전화번호가 없어 보호자 전화번호로 기존 계정을 확인합니다.");

    try {
      const response = await searchAccountCandidates(nextCandidateRole, searchPhone, accessToken);
      setCandidates(response.candidates);
      setHasSearched(true);
      setStep(2);
    } catch (error) {
      setErrorMessage(getAccountCandidateErrorMessage(error));
      setHasSearched(false);
      setStep(1);
    } finally {
      setIsSearching(false);
    }
  };

  const handleRegisterNonMember = async () => {
    if (!accessToken) return;

    setIsSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const guardianParentUserId =
        candidateRole === "PARENT" && candidates.length === 1 ? candidates[0].userId : null;

      await createAcademyStudent({ ...form, guardianParentUserId }, accessToken);
      setSuccessMessage(
        guardianParentUserId
          ? "비회원 학생으로 등록하고 보호자 계정을 연결했습니다."
          : "비회원 학생으로 등록되었습니다.",
      );
      setStep(3);
      onCompleted();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendInvitation = async (candidate: CandidateDto) => {
    if (!accessToken) return;

    setIsSending(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const profile = await createAcademyStudent(form, accessToken);

      await createAcademyStudentInvitation({
        studentProfileId: profile.id,
        receiverUserId: candidate.userId,
        receiverEmail: candidate.email,
        receiverPhone: candidate.phone,
        message: `${form.name} 학생님, 학원 연결 초대장입니다.`,
      }, accessToken);

      setSuccessMessage(`${candidate.name}님께 초대장을 보냈습니다. 수락 후 연결됩니다.`);
      setStep(3);
      onCompleted();
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setForm(initialStudentForm);
    setCandidates([]);
    setHasSearched(false);
    setStep(1);
    setErrorMessage("");
    setSuccessMessage("");
    setCandidateRole("STUDENT");
    setCandidateNotice("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 px-3 py-4 sm:items-center">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-950">학생 등록</h2>
              <p className="mt-1 text-sm text-slate-600">정보 입력, 계정 확인, 등록 완료 순서로 진행합니다.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-500 transition hover:bg-slate-50"
              aria-label="학생 등록 닫기"
            >
              ×
            </button>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold">
            <span className={getModalStepClass(step >= 1)}>1. 정보 입력</span>
            <span className={getModalStepClass(step >= 2)}>2. 계정 확인</span>
            <span className={getModalStepClass(step >= 3)}>3. 완료</span>
          </div>
        </div>

        <div className="grid gap-5 px-5 py-5">
          {step === 1 ? (
            <StudentRegistrationInfoStep
              form={form}
              isSearching={isSearching}
              errorMessage={errorMessage}
              onFormChange={setForm}
              onSearch={handleSearch}
            />
          ) : null}

          {step === 2 ? (
            <StudentAccountCandidateStep
              candidateRole={candidateRole}
              candidateNotice={candidateNotice}
              candidates={candidates}
              errorMessage={errorMessage}
              hasSearched={hasSearched}
              isSending={isSending}
              onBack={() => setStep(1)}
              onRegisterNonMember={handleRegisterNonMember}
              onSendInvitation={handleSendInvitation}
            />
          ) : null}

          {step === 3 ? (
            <StudentRegistrationCompleteStep
              successMessage={successMessage}
              onClose={onClose}
              onReset={resetForm}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StudentRegistrationInfoStep({
  form,
  isSearching,
  errorMessage,
  onFormChange,
  onSearch,
}: {
  form: AcademyStudentCreateRequest;
  isSearching: boolean;
  errorMessage: string;
  onFormChange: (form: AcademyStudentCreateRequest) => void;
  onSearch: () => void;
}) {
  return (
    <form className="grid gap-5">
      <div>
        <h3 className="text-base font-bold text-slate-950">Step 1. 학생 정보 입력</h3>
        <p className="mt-1 text-sm text-slate-600">
          이름은 필수이며, 전화번호는 기존 계정 확인에 사용됩니다.
          <br />
          학생 전화번호가 없으면 보호자 전화번호로 확인할 수 있습니다.
        </p>
      </div>

      {errorMessage ? <ErrorMessage message={errorMessage} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <AcademyTextField
          label="학생 이름"
          value={form.name}
          onChange={(value) => onFormChange({ ...form, name: value })}
          required
        />
        <AcademyTextField
          label="학교"
          value={form.school || ""}
          onChange={(value) => onFormChange({ ...form, school: value })}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AcademyTextField
          label="학년"
          value={form.grade || ""}
          onChange={(value) => onFormChange({ ...form, grade: value })}
        />
        <AcademyTextField
          label="학생 전화번호"
          value={form.phone || ""}
          onChange={(value) => onFormChange({ ...form, phone: value })}
        />
        <AcademyTextField
          label="보호자 전화번호"
          value={form.guardianPhone || ""}
          onChange={(value) => onFormChange({ ...form, guardianPhone: value })}
        />
      </div>

      <label className="block">
        <span className="text-sm font-bold text-slate-700">메모</span>
        <textarea
          value={form.memo || ""}
          onChange={(event) => onFormChange({ ...form, memo: event.target.value })}
          className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </label>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">기존 계정 확인 후 등록하는 것을 권장합니다.</p>
        <button
          type="button"
          onClick={onSearch}
          disabled={isSearching || !form.name}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 px-6 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          {isSearching ? "검색 중..." : "기존 학생 계정 확인"}
        </button>
      </div>
    </form>
  );
}

function StudentAccountCandidateStep({
  candidateRole,
  candidateNotice,
  candidates,
  errorMessage,
  hasSearched,
  isSending,
  onBack,
  onRegisterNonMember,
  onSendInvitation,
}: {
  candidateRole: CandidateRole;
  candidateNotice: string;
  candidates: CandidateDto[];
  errorMessage: string;
  hasSearched: boolean;
  isSending: boolean;
  onBack: () => void;
  onRegisterNonMember: () => void;
  onSendInvitation: (candidate: CandidateDto) => void;
}) {
  return (
    <div className="grid gap-5">
      <div>
        <h3 className="text-base font-bold text-slate-950">Step 2. 기존 계정 확인 결과</h3>
        <p className="mt-1 text-sm text-slate-600">
          {candidateRole === "STUDENT"
            ? "학생 계정 후보가 있으면 학원 연결 초대장을 보낼 수 있습니다."
            : candidates.length === 1
              ? "보호자 계정이 확인되었습니다. 학생을 비회원으로 등록하면서 이 보호자 계정을 함께 연결합니다."
              : "보호자 전화번호는 학생의 수동 연락처로 저장됩니다."}
        </p>
      </div>

      {candidateNotice ? (
        <p className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          {candidateNotice}
        </p>
      ) : null}

      {errorMessage ? <ErrorMessage message={errorMessage} /> : null}

      {hasSearched && candidates.length > 0 ? (
        <CandidateList
          candidateRole={candidateRole}
          candidates={candidates}
          isSending={isSending}
          onSendInvitation={onSendInvitation}
        />
      ) : null}

      {hasSearched && candidates.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
          {candidateRole === "PARENT"
            ? "일치하는 보호자 계정이 없습니다. 보호자 전화번호는 연락처로만 저장됩니다."
            : "일치하는 학생 계정이 없습니다."}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          정보 수정
        </button>
        <button
          type="button"
          disabled={isSending}
          onClick={onRegisterNonMember}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-slate-700 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
        >
          {isSending
            ? "처리 중..."
            : candidateRole === "PARENT" && candidates.length === 1
              ? "보호자 연결 후 비회원 학생 등록"
              : "비회원 학생으로 등록"}
        </button>
      </div>
    </div>
  );
}

function CandidateList({
  candidateRole,
  candidates,
  isSending,
  onSendInvitation,
}: {
  candidateRole: CandidateRole;
  candidates: CandidateDto[];
  isSending: boolean;
  onSendInvitation: (candidate: CandidateDto) => void;
}) {
  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-slate-700">
        {candidateRole === "PARENT" && candidates.length === 1
          ? "보호자 계정이 확인되었습니다."
          : `일치하는 ${candidateRole === "STUDENT" ? "학생" : "보호자"} 계정이 ${candidates.length}건 있습니다.`}
      </p>
      {candidates.map((candidate) => (
        <div key={candidate.userId} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-bold text-slate-950">{candidate.name}</p>
            <p className="mt-1 break-all text-xs text-slate-500">
              {candidateRole === "STUDENT" ? "학생 계정" : "보호자 계정"} | {candidate.phone || "-"}
            </p>
          </div>
          {candidateRole === "STUDENT" ? (
            <button
              type="button"
              disabled={isSending}
              onClick={() => onSendInvitation(candidate)}
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl bg-blue-700 px-4 text-xs font-semibold text-white transition hover:bg-blue-800 disabled:bg-slate-400"
            >
              초대 보내기
            </button>
          ) : (
            <span className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
              {candidates.length === 1 ? "등록 시 함께 연결" : "수동 연락처로 저장"}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function StudentRegistrationCompleteStep({
  successMessage,
  onClose,
  onReset,
}: {
  successMessage: string;
  onClose: () => void;
  onReset: () => void;
}) {
  return (
    <div className="grid gap-5">
      <div>
        <h3 className="text-base font-bold text-slate-950">Step 3. 완료</h3>
        {successMessage ? (
          <p className="mt-3 rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {successMessage}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          계속 등록
        </button>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-blue-700 px-5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

function AcademyTextField({
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

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="whitespace-pre-line rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
      {message}
    </p>
  );
}

function getModalStepClass(isActive: boolean) {
  return isActive
    ? "rounded-2xl bg-blue-50 px-2 py-2 text-blue-700"
    : "rounded-2xl bg-slate-50 px-2 py-2 text-slate-400";
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "요청을 처리하지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.";
}

function getAccountCandidateErrorMessage(error: unknown) {
  if (error instanceof ApiError && (error.status === 400 || error.status === 500)) {
    return "기존 계정 확인에 실패했습니다. 잠시 후 다시 시도해 주세요.";
  }

  return getErrorMessage(error);
}

const initialStudentForm: AcademyStudentCreateRequest = {
  name: "",
  school: "",
  grade: "",
  phone: "",
  guardianPhone: "",
  memo: "",
};
