export type SignupRole = "OWNER" | "PARENT" | "STUDENT";

export type SignupRequest = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: SignupRole;
};

export type SignupResponse = {
  userId: number;
  email: string;
  name: string;
  role: SignupRole;
};
