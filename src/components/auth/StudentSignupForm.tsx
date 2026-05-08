"use client";

import { SignupForm } from "./SignupForm";

export function StudentSignupForm() {
  return (
    <SignupForm
      role="STUDENT"
      submitLabel="학생 가입하기"
      notice="학원 연결은 가입 후 학원 초대코드 또는 학부모/학원 연결을 통해 진행될 예정입니다."
    />
  );
}
