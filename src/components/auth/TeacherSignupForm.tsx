"use client";

import { SignupForm } from "./SignupForm";

export function TeacherSignupForm() {
  return (
    <SignupForm
      role="TEACHER"
      submitLabel="선생님 가입하기"
      notice="가입 후 학원 계정의 승인/초대를 통해 학원에 연결될 예정입니다."
    />
  );
}
