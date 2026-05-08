"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { signup } from "@/lib/api";
import { signupSchema, type SignupFormValues } from "@/lib/validations/auth";
import type { Role } from "@/types/auth";

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "OWNER", label: "원장 OWNER" },
  { value: "DESK", label: "데스크 DESK" },
  { value: "TEACHER", label: "선생님 TEACHER" },
  { value: "PARENT", label: "학부모 PARENT" },
  { value: "STUDENT", label: "학생 STUDENT" },
];

export function SignupForm() {
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      phone: "",
      role: "OWNER",
    },
  });

  const onSubmit = async (values: SignupFormValues) => {
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await signup(values);
      setSuccessMessage(`${response.name}님의 계정이 생성되었습니다.`);
      reset();
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
      <Field label="이메일" error={errors.email?.message}>
        <input
          className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          {...register("email")}
        />
      </Field>

      <Field label="비밀번호" error={errors.password?.message}>
        <input
          className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          type="password"
          autoComplete="new-password"
          placeholder="8자 이상 입력"
          {...register("password")}
        />
      </Field>

      <Field label="이름" error={errors.name?.message}>
        <input
          className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          type="text"
          autoComplete="name"
          placeholder="홍길동"
          {...register("name")}
        />
      </Field>

      <Field label="전화번호" error={errors.phone?.message}>
        <input
          className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          type="tel"
          autoComplete="tel"
          placeholder="010-1234-5678"
          {...register("phone")}
        />
      </Field>

      <Field label="권한" error={errors.role?.message}>
        <select
          className="h-12 w-full rounded-md border border-slate-200 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          {...register("role")}
        >
          {roleOptions.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </Field>

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
        {isSubmitting ? "가입 처리 중" : "회원가입"}
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
