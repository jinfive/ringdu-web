"use client";

import { SignupForm } from "./SignupForm";

export function ParentSignupForm() {
  return (
    <SignupForm
      role="PARENT"
      submitLabel="학부모 가입하기"
      notice="가입 후 자녀 연결은 학원 초대코드 또는 자녀 연결 기능을 통해 진행될 예정입니다."
    />
  );
}
