"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  type FieldErrors,
  type Resolver,
  type UseFormRegister,
  useForm,
} from "react-hook-form";
import { signup } from "@/lib/api";
import { academySignupSchema, baseSignupSchema } from "@/lib/validations/auth";
import type { SignupRole } from "@/types/auth";

type SignupFormValues = {
  email: string;
  password: string;
  name: string;
  phone: string;
  academyName?: string;
  academyPhone?: string;
  academyAddress?: string;
};

type SignupSchema = typeof baseSignupSchema | typeof academySignupSchema;

type SignupFormProps = {
  role: SignupRole;
  schema: SignupSchema;
  defaultValues: SignupFormValues;
  submitLabel: string;
  children?: (props: {
    register: UseFormRegister<SignupFormValues>;
    errors: FieldErrors<SignupFormValues>;
  }) => React.ReactNode;
  notice?: string;
};

export function SignupForm({
  role,
  schema,
  defaultValues,
  submitLabel,
  children,
  notice,
}: SignupFormProps) {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(schema) as Resolver<SignupFormValues>,
    defaultValues,
  });

  const onSubmit = async (values: SignupFormValues) => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const { email, password, name, phone } = values;
      // Academy fields are collected for the UI flow now, and will be sent after the backend signup API expands.
      const response = await signup({
        email,
        password,
        name,
        phone,
        role,
      });
      setSuccessMessage(`${response.name}님의 계정이 생성되었습니다.`);
      reset(defaultValues);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "회원가입 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="이름" error={getErrorMessage(errors.name)}>
        <input
          className={inputClassName}
          type="text"
          autoComplete="name"
          placeholder="홍길동"
          {...register("name")}
        />
      </Field>

      <Field label="이메일" error={getErrorMessage(errors.email)}>
        <input
          className={inputClassName}
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          {...register("email")}
        />
      </Field>

      <Field label="비밀번호" error={getErrorMessage(errors.password)}>
        <input
          className={inputClassName}
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상 입력"
          {...register("password")}
        />
      </Field>

      <Field label="전화번호" error={getErrorMessage(errors.phone)}>
        <input
          className={inputClassName}
          type="tel"
          autoComplete="tel"
          placeholder="010-1234-5678"
          {...register("phone")}
        />
      </Field>

      {children?.({ register, errors })}

      {notice ? (
        <p className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-6 text-blue-700">
          {notice}
        </p>
      ) : null}

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
        {isSubmitting ? "가입 처리 중" : submitLabel}
      </button>
    </form>
  );
}

export const inputClassName =
  "h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100";

export function Field({
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

export function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  }

  return undefined;
}
