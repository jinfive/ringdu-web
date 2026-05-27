"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ApiError, requestAcademySignup } from "@/lib/api";
import {
  academySignupSchema,
  type AcademySignupFormValues,
} from "@/lib/validations/auth";
import { inputClassName } from "./SignupForm";

export function AcademySignupApplicationForm() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AcademySignupFormValues>({
    resolver: zodResolver(academySignupSchema),
    defaultValues: {
      email: "",
      password: "",
      passwordConfirm: "",
      academyName: "",
      representativeName: "",
      phone: "",
      postalCode: "",
      address: "",
      detailAddress: "",
    },
  });

  const onSubmit = async (values: AcademySignupFormValues) => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await requestAcademySignup(values);
      setSuccessMessage("학원 가입 신청이 완료되었습니다. 관리자 승인 후 로그인할 수 있습니다.");
      reset();
    } catch (error) {
      setErrorMessage(getAcademySignupErrorMessage(error));
    }
  };

  const handleAddressSearch = () => {
    window.alert("주소 찾기는 준비 중입니다. 우편번호와 주소를 직접 입력해 주세요.");
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="학원명" error={getFieldError(errors.academyName)}>
        <input
          className={inputClassName}
          type="text"
          autoComplete="organization"
          placeholder="링듀수학학원"
          {...register("academyName")}
        />
      </Field>

      <Field label="대표자명" error={getFieldError(errors.representativeName)}>
        <input
          className={inputClassName}
          type="text"
          autoComplete="name"
          placeholder="홍길동"
          {...register("representativeName")}
        />
      </Field>

      <Field label="이메일" error={getFieldError(errors.email)}>
        <input
          className={inputClassName}
          type="email"
          autoComplete="email"
          placeholder="academy@example.com"
          {...register("email")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="비밀번호" error={getFieldError(errors.password)}>
          <input
            className={inputClassName}
            type="password"
            autoComplete="new-password"
            placeholder="영문, 숫자 포함 8자 이상"
            {...register("password")}
          />
        </Field>

        <Field label="비밀번호 확인" error={getFieldError(errors.passwordConfirm)}>
          <input
            className={inputClassName}
            type="password"
            autoComplete="new-password"
            placeholder="비밀번호 다시 입력"
            {...register("passwordConfirm")}
          />
        </Field>
      </div>

      <Field label="전화번호" error={getFieldError(errors.phone)}>
        <input
          className={inputClassName}
          type="tel"
          autoComplete="tel"
          placeholder="010-1234-5678"
          {...register("phone")}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field label="우편번호" error={getFieldError(errors.postalCode)}>
          <input
            className={inputClassName}
            type="text"
            inputMode="numeric"
            placeholder="06123"
            {...register("postalCode")}
          />
        </Field>
        <div className="flex items-end">
          <button
            type="button"
            onClick={handleAddressSearch}
            className="h-12 rounded-md border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            주소 찾기
          </button>
        </div>
      </div>

      <Field label="기본 주소" error={getFieldError(errors.address)}>
        <input
          className={inputClassName}
          type="text"
          autoComplete="street-address"
          placeholder="서울시 강남구 테헤란로"
          {...register("address")}
        />
      </Field>

      <Field label="상세 주소" error={getFieldError(errors.detailAddress)}>
        <input
          className={inputClassName}
          type="text"
          placeholder="101호"
          {...register("detailAddress")}
        />
      </Field>

      <p className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
        학원 계정은 가입 신청 후 관리자 승인을 받아야 로그인할 수 있습니다. 주민등록번호는
        수집하지 않습니다.
      </p>

      {successMessage ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full rounded-md bg-blue-700 px-4 text-base font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
      >
        {isSubmitting ? "신청 처리 중" : "학원 가입 신청"}
      </button>
    </form>
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

function getFieldError(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}

function getAcademySignupErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 409) {
    return getDuplicatedAccountMessage(error.message);
  }

  if (error instanceof ApiError && error.status === 400) {
    return "입력 내용을 확인해 주세요.";
  }

  return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}

function getDuplicatedAccountMessage(message: string) {
  if (message.includes("전화번호")) {
    return "이미 사용 중인 전화번호입니다.";
  }

  return "이미 사용 중인 이메일입니다.";
}
