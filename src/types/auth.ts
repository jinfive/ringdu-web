export type Role = "OWNER" | "DESK" | "TEACHER" | "PARENT" | "STUDENT";

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: Role;
};

export type SignupResponse = {
  userId: number;
  email: string;
  name: string;
  role: Role;
};
