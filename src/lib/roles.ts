import type { UserRole } from "@/types/auth";

export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  ADMIN: "/admin",
  ACADEMY: "/academy",
  TEACHER: "/teacher",
  PARENT: "/parent",
  STUDENT: "/student",
};

export const ROLE_HOME_LABELS: Record<UserRole, string> = {
  ADMIN: "관리자 홈",
  ACADEMY: "학원 홈",
  TEACHER: "선생님 홈",
  PARENT: "학부모 홈",
  STUDENT: "학생 홈",
};

export function getRoleHomePath(role: UserRole) {
  return ROLE_HOME_PATHS[role];
}

export function getRoleHomeLabel(role: UserRole) {
  return ROLE_HOME_LABELS[role];
}
