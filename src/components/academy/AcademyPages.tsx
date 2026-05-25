"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { ApiError, getMyAcademy, updateMyAcademy } from "@/lib/api";
import { useAuth } from "@/components/auth/AuthProvider";
import type { AcademyUpdateRequest } from "@/types/auth";
import {
  AcademyCard,
  AcademyLinkButton,
  AcademyShell,
  EmptyState,
  FieldPreview,
  StatusBadge,
  TabPreview,
} from "./AcademyShell";

export function AcademyStudentsPage() {
  return (
    <AcademyShell
      title="학생 관리"
      description="학생과 보호자 정보를 관리하세요."
      actions={<AcademyLinkButton href="/academy/students/new">학생(부모) 등록</AcademyLinkButton>}
    >
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 md:grid-cols-[1.5fr_0.7fr_0.7fr_0.7fr]">
            <FieldPreview label="검색" value="학생 이름 검색" />
            <FieldPreview label="학년" value="전체" />
            <FieldPreview label="상태" value="전체" />
            <FieldPreview label="미납 여부" value="전체" />
          </div>
        </AcademyCard>
        <EmptyState
          title="아직 등록된 학생이 없습니다."
          description="학생과 보호자 정보를 등록해 관리를 시작해 보세요."
          action={<AcademyLinkButton href="/academy/students/new">학생(부모) 등록</AcademyLinkButton>}
        />
      </div>
    </AcademyShell>
  );
}

export function AcademyStudentNewPage() {
  return (
    <AcademyShell title="학생(부모) 등록" description="학생과 보호자를 함께 등록하는 단계형 화면입니다.">
      <div className="grid gap-5 lg:grid-cols-4">
        {["1단계: 학생 정보", "2단계: 부모 정보", "3단계: 수강 정보", "4단계: 확인"].map((step) => (
          <AcademyCard key={step}>
            <h2 className="text-lg font-bold text-slate-950">{step}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">도메인 API 연결 후 입력 폼이 제공됩니다.</p>
          </AcademyCard>
        ))}
      </div>
      <div className="mt-6">
        <EmptyState
          title="학생 등록 기능은 준비 중입니다."
          description="학생 기본 정보, 부모 정보, 수강 정보를 순서대로 입력할 수 있도록 준비하고 있습니다."
        />
      </div>
    </AcademyShell>
  );
}

export function AcademyStudentDetailPage({ studentId }: { studentId: string }) {
  return (
    <AcademyShell title="학생 상세" description={`학생 ID ${studentId}의 상세 정보를 확인하는 화면입니다.`}>
      <div className="space-y-6">
        <TabPreview tabs={["기본 정보", "부모 정보", "수강 정보", "출석 기록", "청구서/수강료", "재원생 상담"]} />
        <AcademyCard>
          <div className="flex items-center justify-between gap-4">
            <div>
              <StatusBadge>재원생</StatusBadge>
              <h2 className="mt-3 text-xl font-bold text-slate-950">학생 정보 영역</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                재원생 상담은 신규 상담 메뉴와 분리해 학생 상세 안에서 관리합니다.
              </p>
            </div>
          </div>
        </AcademyCard>
      </div>
    </AcademyShell>
  );
}

export function AcademyTeachersPage() {
  return (
    <AcademyShell
      title="선생님 관리"
      description="학원에 소속된 선생님을 관리합니다."
      actions={<AcademyLinkButton href="/academy/teachers/new">선생님 등록</AcademyLinkButton>}
    >
      <EmptyState
        title="아직 등록된 선생님이 없습니다."
        description="선생님을 등록해 수업과 시간표를 관리해 보세요."
        action={<AcademyLinkButton href="/academy/teachers/new">선생님 등록</AcademyLinkButton>}
      />
    </AcademyShell>
  );
}

export function AcademyTeacherNewPage() {
  return (
    <AcademyShell title="선생님 등록" description="선생님 기본 정보와 담당 과목을 등록하는 화면입니다.">
      <AcademyCard>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["이름", "이메일", "전화번호", "담당 과목", "담당 수업 수", "상태"].map((field) => (
            <FieldPreview key={field} label={field} value="준비 중" />
          ))}
        </div>
      </AcademyCard>
    </AcademyShell>
  );
}

export function AcademySchedulePage() {
  return (
    <AcademyShell
      title="시간표 관리"
      description="요일별 수업과 담당 선생님을 확인하고 수업 상세로 이동합니다."
      actions={<AcademyLinkButton href="/academy/schedule/new">시간표 생성</AcademyLinkButton>}
    >
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 md:grid-cols-3">
            <FieldPreview label="요일" value="전체" />
            <FieldPreview label="선생님" value="전체" />
            <FieldPreview label="상태" value="운영 중" />
          </div>
        </AcademyCard>
        <Link href="/academy/schedule/sample-class" className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <StatusBadge>예시</StatusBadge>
              <h2 className="mt-3 text-xl font-bold text-slate-950">중2 수학 A반</h2>
              <p className="mt-2 text-sm text-slate-600">월/수 18:00 - 20:00</p>
            </div>
            <div className="text-sm leading-6 text-slate-600">
              <p>담당 선생님 미지정</p>
              <p>수강 학생 0명</p>
            </div>
          </div>
        </Link>
      </div>
    </AcademyShell>
  );
}

export function AcademyScheduleNewPage() {
  return (
    <AcademyShell title="시간표 생성" description="수업명, 요일, 시간, 담당 선생님을 입력해 시간표를 만드는 화면입니다.">
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["수업명", "담당 선생님", "요일", "시작 시간", "종료 시간", "강의실", "수강 학생", "메모"].map((field) => (
              <FieldPreview key={field} label={field} value="준비 중" />
            ))}
          </div>
        </AcademyCard>
        <EmptyState
          title="시간표 생성 기능은 준비 중입니다."
          description="수업명, 요일, 시간, 담당 선생님을 입력해 시간표를 만들 수 있도록 준비하고 있습니다."
        />
      </div>
    </AcademyShell>
  );
}

export function AcademyScheduleDetailPage({ classId }: { classId: string }) {
  return (
    <AcademyShell title="수업/클래스 상세 관리" description={`시간표에서 선택한 수업 ${classId}의 상세 관리 화면입니다.`}>
      <div className="space-y-6">
        <TabPreview tabs={["기본 정보", "수강 학생", "시간표", "출석 기록", "숙제", "공지"]} />
        <AcademyCard>
          <h2 className="text-xl font-bold text-slate-950">클래스 관리는 이 화면에서 처리합니다.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            독립적인 클래스 관리 메뉴를 두지 않고 시간표에서 특정 수업을 선택해 상세 관리로 진입합니다.
          </p>
        </AcademyCard>
      </div>
    </AcademyShell>
  );
}

export function AcademyConsultationsPage() {
  return (
    <AcademyShell
      title="신규 상담"
      description="등록 전 문의와 신규 상담 예약 상태를 관리합니다."
      actions={<AcademyLinkButton href="/academy/consultations/new">신규 상담 등록</AcademyLinkButton>}
    >
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {["학생 이름", "보호자 이름", "연락처", "희망 과목", "희망 상담일", "상태", "메모"].map((field) => (
              <FieldPreview key={field} label={field} value="목록 항목" />
            ))}
          </div>
        </AcademyCard>
        <EmptyState
          title="신규 상담 내역이 없습니다."
          description="등록 전 문의는 이 화면에서 관리하고, 재원생 상담은 학생 상세 화면에서 관리합니다."
          action={<AcademyLinkButton href="/academy/consultations/new">신규 상담 등록</AcademyLinkButton>}
        />
      </div>
    </AcademyShell>
  );
}

export function AcademyConsultationNewPage() {
  return (
    <AcademyShell title="신규 상담 등록" description="등록 전 문의와 상담 예약 정보를 입력하는 화면입니다.">
      <AcademyCard>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {["학생 이름", "보호자 이름", "연락처", "희망 과목", "희망 상담일", "상태", "메모"].map((field) => (
            <FieldPreview key={field} label={field} value="준비 중" />
          ))}
        </div>
      </AcademyCard>
    </AcademyShell>
  );
}

export function AcademyInvoicesPage() {
  return (
    <AcademyShell title="청구서/수납" description="학생별 청구서와 수강료 납부 상태를 확인합니다.">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {["이번 달 청구서 0건", "미납 목록 0건", "납부 완료 0건", "청구서 미발송 0건"].map((item) => (
          <AcademyCard key={item}>
            <p className="text-lg font-bold text-slate-950">{item}</p>
            <p className="mt-2 text-sm text-slate-600">상태 관리는 도메인 API 연결 후 제공됩니다.</p>
          </AcademyCard>
        ))}
      </div>
    </AcademyShell>
  );
}

export function AcademyAttendancePage() {
  return (
    <AcademyShell title="출석 현황" description="학원 계정은 출석 처리 결과와 기록을 조회합니다.">
      <div className="space-y-6">
        <AcademyCard>
          <div className="grid gap-3 md:grid-cols-4">
            <FieldPreview label="기간" value="이번 달" />
            <FieldPreview label="클래스" value="전체" />
            <FieldPreview label="학생" value="전체" />
            <FieldPreview label="상태" value="지각/결석 포함" />
          </div>
        </AcademyCard>
        <EmptyState
          title="출석 기록이 없습니다."
          description="클래스별 출석 기록, 학생별 출석 기록, 지각/결석 목록을 조회할 수 있도록 준비하고 있습니다."
        />
      </div>
    </AcademyShell>
  );
}

export function AcademySettingsPage() {
  const { accessToken } = useAuth();
  const [form, setForm] = useState<AcademyUpdateRequest>({
    name: "",
    representativeName: "",
    phone: "",
    postalCode: "",
    address: "",
    detailAddress: "",
  });
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    let isMounted = true;
    void getMyAcademy(accessToken)
      .then((academy) => {
        if (isMounted) {
          setForm({
            name: academy.name,
            representativeName: academy.representativeName,
            phone: academy.phone,
            postalCode: academy.postalCode ?? "",
            address: academy.address ?? "",
            detailAddress: academy.detailAddress ?? "",
          });
        }
      })
      .catch((error) => {
        if (isMounted) {
          setErrorMessage(getSettingsErrorMessage(error));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [accessToken]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!accessToken) {
      setErrorMessage("학원 정보를 저장하지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.");
      return;
    }

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const academy = await updateMyAcademy(form, accessToken);
      setForm({
        name: academy.name,
        representativeName: academy.representativeName,
        phone: academy.phone,
        postalCode: academy.postalCode ?? "",
        address: academy.address ?? "",
        detailAddress: academy.detailAddress ?? "",
      });
      setSuccessMessage("학원 정보가 저장되었습니다.");
    } catch {
      setErrorMessage("학원 정보를 저장하지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AcademyShell title="학원 설정" description="학원 기본 정보와 계정 정보를 관리합니다.">
      <AcademyCard>
        {isLoading ? (
          <p className="text-sm font-semibold text-slate-600">학원 정보를 불러오고 있습니다.</p>
        ) : null}

        {successMessage ? (
          <p className="mb-5 rounded-md border border-green-100 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="mb-5 whitespace-pre-line rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        ) : null}

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <AcademyTextField
              label="학원명"
              value={form.name}
              onChange={(value) => setForm((current) => ({ ...current, name: value }))}
              required
            />
            <AcademyTextField
              label="대표자명"
              value={form.representativeName}
              onChange={(value) => setForm((current) => ({ ...current, representativeName: value }))}
              required
            />
            <AcademyTextField
              label="전화번호"
              value={form.phone}
              onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
              required
            />
            <AcademyTextField
              label="우편번호"
              value={form.postalCode}
              onChange={(value) => setForm((current) => ({ ...current, postalCode: value }))}
            />
            <AcademyTextField
              label="기본 주소"
              value={form.address}
              onChange={(value) => setForm((current) => ({ ...current, address: value }))}
            />
            <AcademyTextField
              label="상세 주소"
              value={form.detailAddress}
              onChange={(value) => setForm((current) => ({ ...current, detailAddress: value }))}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center rounded-md bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isSaving ? "저장 중" : "저장"}
            </button>
          </div>
        </form>
      </AcademyCard>
    </AcademyShell>
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
        className="mt-2 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  );
}

function getSettingsErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  return "학원 정보를 저장하지 못했습니다.\n입력 내용을 확인한 뒤 다시 시도해 주세요.";
}
