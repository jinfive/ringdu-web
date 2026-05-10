"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError, createAcademyAccount } from "@/lib/api";
import {
  academyAccountSchema,
  type AcademyAccountFormValues,
} from "@/lib/validations/auth";
import type { AcademyAccountResponse } from "@/types/auth";
import { useAuth } from "./AuthProvider";
import { inputClassName } from "./SignupForm";

export function AdminAcademyAccountForm() {
  const { accessToken } = useAuth();
  const [createdAccount, setCreatedAccount] = useState<AcademyAccountResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AcademyAccountFormValues>({
    resolver: zodResolver(academyAccountSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
    },
  });

  const onSubmit = async (values: AcademyAccountFormValues) => {
    setCreatedAccount(null);
    setErrorMessage("");

    if (!accessToken) {
      setErrorMessage("관리자 인증이 필요합니다.");
      return;
    }

    try {
      const response = await createAcademyAccount(values, accessToken);
      setCreatedAccount(response);
      reset();
    } catch (error) {
      setErrorMessage(getAcademyAccountErrorMessage(error));
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form
        className="rounded-lg border border-blue-100 bg-white p-6 shadow-xl shadow-blue-100/60"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="이메일" error={getFieldError(errors.email)}>
            <input
              className={inputClassName}
              type="email"
              autoComplete="email"
              placeholder="academy@example.com"
              {...register("email")}
            />
          </Field>

          <Field label="전화번호" error={getFieldError(errors.phone)}>
            <input
              className={inputClassName}
              type="tel"
              autoComplete="tel"
              placeholder="010-1234-5678"
              {...register("phone")}
            />
          </Field>

          <Field label="학원 계정 이름" error={getFieldError(errors.name)}>
            <input
              className={inputClassName}
              type="text"
              autoComplete="organization"
              placeholder="링듀수학학원"
              {...register("name")}
            />
          </Field>

          <Field label="비밀번호" error={getFieldError(errors.password)}>
            <input
              className={inputClassName}
              type="password"
              autoComplete="new-password"
              placeholder="8자 이상 입력"
              {...register("password")}
            />
          </Field>
        </div>

        {errorMessage ? (
          <p className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {createdAccount ? (
          <p className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            학원 계정이 생성되었습니다.
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 h-12 rounded-md bg-blue-700 px-5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {isSubmitting ? "생성 중" : "학원 계정 생성"}
        </button>
      </form>

      <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100">
        <h2 className="text-lg font-bold text-slate-950">생성 결과</h2>
        {createdAccount ? (
          <dl className="mt-5 space-y-3 text-sm">
            <ResultItem label="이메일" value={createdAccount.email} />
            <ResultItem label="이름" value={createdAccount.name} />
            <ResultItem label="전화번호" value={createdAccount.phone} />
            <ResultItem label="권한" value={createdAccount.role} />
            <ResultItem label="상태" value={createdAccount.status} />
          </dl>
        ) : (
          <p className="mt-4 text-sm leading-6 text-slate-500">
            생성된 학원 계정 정보가 여기에 표시됩니다.
          </p>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error ? <span className="mt-2 block text-sm font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-1 text-slate-900">{value}</dd>
    </div>
  );
}

function getFieldError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}

function getAcademyAccountErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return "이미 사용 중인 이메일입니다.";
    }

    if (error.status === 400) {
      return "입력 내용을 확인해 주세요.";
    }

    if (error.status === 401 || error.status === 403) {
      return "관리자 권한이 필요합니다.";
    }
  }

  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
