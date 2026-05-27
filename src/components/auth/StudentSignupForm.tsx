"use client";

import { SignupForm } from "./SignupForm";

export function StudentSignupForm() {
  return (
    <SignupForm
      role="STUDENT"
      submitLabel="학생 가입하기"
      notice="가입 후 학원 초대장과 보호자 연결 초대장을 확인할 수 있습니다."
    />
  );
}
