export type BillingStatus = "NOT_ISSUED" | "UNPAID" | "PARTIAL" | "PAID" | "CANCELED";

export type StudentBillingSetting = {
  studentProfileId: number;
  monthlyTuition: number;
  dueDay: number;
  memo?: string;
};

export type StudentBillingInvoice = {
  billingId: number;
  studentProfileId: number;
  billingMonth: string;
  issuedDate: string;
  dueDay: number;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: Exclude<BillingStatus, "NOT_ISSUED">;
  memo?: string;
};

export type StudentBillingState = {
  setting: StudentBillingSetting;
  invoices: StudentBillingInvoice[];
  nextBillingId: number;
};

export const billingStatusLabels: Record<BillingStatus, string> = {
  NOT_ISSUED: "미청구",
  UNPAID: "미납",
  PARTIAL: "부분수납",
  PAID: "완납",
  CANCELED: "취소",
};

export const billingStatusStyles: Record<BillingStatus, string> = {
  NOT_ISSUED: "bg-slate-100 text-slate-600 ring-slate-200",
  UNPAID: "bg-red-50 text-red-700 ring-red-100",
  PARTIAL: "bg-amber-50 text-amber-700 ring-amber-100",
  PAID: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  CANCELED: "bg-slate-100 text-slate-500 ring-slate-200",
};
