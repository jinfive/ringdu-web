"use client";

import { baseSignupSchema } from "@/lib/validations/auth";
import { SignupForm } from "./SignupForm";

export function ParentSignupForm() {
  return (
    <SignupForm
      role="PARENT"
      schema={baseSignupSchema}
      defaultValues={{ email: "", password: "", name: "", phone: "" }}
      submitLabel="학부모 가입하기"
      notice="자녀 연결은 가입 후 학원 초대코드 또는 자녀 코드로 진행될 예정입니다."
    />
  );
}
