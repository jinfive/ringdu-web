import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "영문, 숫자를 포함해 8자 이상 입력해 주세요.")
  .regex(/[A-Za-z]/, "영문, 숫자를 포함해 8자 이상 입력해 주세요.")
  .regex(/[0-9]/, "영문, 숫자를 포함해 8자 이상 입력해 주세요.");

export const baseSignupSchema = z
  .object({
    email: z.email("이메일 형식으로 입력해 주세요."),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해 주세요."),
    name: z.string().trim().min(1, "이름을 입력해 주세요."),
    phone: z.string().trim().min(1, "전화번호를 입력해 주세요."),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export type BaseSignupFormValues = z.infer<typeof baseSignupSchema>;

export const loginSchema = z.object({
  email: z.email("이메일 형식으로 입력해 주세요."),
  password: z.string().trim().min(1, "비밀번호를 입력해 주세요."),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const academyAccountSchema = z.object({
  email: z.email("이메일 형식으로 입력해 주세요."),
  password: passwordSchema,
  name: z.string().trim().min(1, "학원 계정 이름을 입력해 주세요."),
  phone: z.string().trim().min(1, "전화번호를 입력해 주세요."),
});

export type AcademyAccountFormValues = z.infer<typeof academyAccountSchema>;

export const academySignupSchema = z
  .object({
    email: z.email("이메일 형식으로 입력해 주세요."),
    password: passwordSchema,
    passwordConfirm: z.string().min(1, "비밀번호 확인을 입력해 주세요."),
    academyName: z.string().trim().min(1, "학원명을 입력해 주세요."),
    representativeName: z.string().trim().min(1, "대표자명을 입력해 주세요."),
    phone: z.string().trim().min(1, "전화번호를 입력해 주세요."),
    postalCode: z.string().trim().min(1, "우편번호를 입력해 주세요."),
    address: z.string().trim().min(1, "기본 주소를 입력해 주세요."),
    detailAddress: z.string().trim().min(1, "상세 주소를 입력해 주세요."),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: "비밀번호가 일치하지 않습니다.",
    path: ["passwordConfirm"],
  });

export type AcademySignupFormValues = z.infer<typeof academySignupSchema>;
