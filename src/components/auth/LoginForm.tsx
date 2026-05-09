"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ReactNode } from "react";
import { ApiError } from "@/lib/api";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { useAuth } from "./AuthProvider";
import { inputClassName } from "./SignupForm";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setErrorMessage("");

    try {
      await login(values);
      router.push("/");
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    }
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field label="이메일" error={getFieldError(errors.email)}>
        <input
          className={inputClassName}
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          {...register("email")}
        />
      </Field>

      <Field label="비밀번호" error={getFieldError(errors.password)}>
        <input
          className={inputClassName}
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호 입력"
          {...register("password")}
        />
      </Field>

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
        {isSubmitting ? "로그인 처리 중" : "로그인"}
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
  children: ReactNode;
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

function getLoginErrorMessage(error: unknown) {
  if (error instanceof ApiError && (error.status === 401 || error.status === 404)) {
    return "이메일 또는 비밀번호를 확인해 주세요.";
  }

  return "일시적으로 로그인을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
}
