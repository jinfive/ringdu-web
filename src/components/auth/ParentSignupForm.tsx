"use client";

import { SignupForm } from "./SignupForm";

export function ParentSignupForm() {
  return (
    <SignupForm
      role="PARENT"
      submitLabel="학부모 가입하기"
      notice="가입 후 자녀 연결 화면에서 학생에게 연결 초대장을 보낼 수 있습니다."
    />
  );
}
