import { z } from "zod";

export const baseSignupSchema = z.object({
  email: z.email("올바른 이메일 주소를 입력해 주세요."),
  password: z.string().min(8, "비밀번호는 최소 8자 이상이어야 합니다."),
  name: z.string().trim().min(1, "이름을 입력해 주세요."),
  phone: z.string().trim().min(1, "전화번호를 입력해 주세요."),
});

export type BaseSignupFormValues = z.infer<typeof baseSignupSchema>;
