"use client";

import { academySignupSchema } from "@/lib/validations/auth";
import { Field, SignupForm, getErrorMessage, inputClassName } from "./SignupForm";

const defaultValues = {
  email: "",
  password: "",
  name: "",
  phone: "",
  academyName: "",
  academyPhone: "",
  academyAddress: "",
};

export function AcademySignupForm() {
  return (
    <SignupForm
      role="OWNER"
      schema={academySignupSchema}
      defaultValues={defaultValues}
      submitLabel="학원 가입하기"
      notice="학원 정보는 현재 화면에서만 준비하며, 백엔드 API 확장 후 함께 저장될 예정입니다."
    >
      {({ register, errors }) => (
        <>
          <Field label="학원명" error={getErrorMessage(errors.academyName)}>
            <input
              className={inputClassName}
              type="text"
              placeholder="링듀학원"
              {...register("academyName")}
            />
          </Field>
          <Field label="학원 전화번호" error={getErrorMessage(errors.academyPhone)}>
            <input
              className={inputClassName}
              type="tel"
              placeholder="02-123-4567"
              {...register("academyPhone")}
            />
          </Field>
          <Field label="학원 주소" error={getErrorMessage(errors.academyAddress)}>
            <input
              className={inputClassName}
              type="text"
              placeholder="서울시 강남구 ..."
              {...register("academyAddress")}
            />
          </Field>
        </>
      )}
    </SignupForm>
  );
}
