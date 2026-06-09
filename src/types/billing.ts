export type BillingStatus = "NOT_ISSUED" | "UNPAID" | "PARTIAL" | "PAID" | "CANCELED";
export type InvoiceBillingStatus = Exclude<BillingStatus, "NOT_ISSUED">;
export type BillingType = "REGULAR" | "PREPAID" | "MAKEUP" | "TEXTBOOK" | "ETC";

export type StudentBillingSetting = {
  studentProfileId: number;
  monthlyTuition: number;
  dueDay: number;
  memo: string | null;
  configured: boolean;
};

export type StudentBillingSettingRequest = {
  monthlyTuition: number;
  dueDay: number;
  memo?: string | null;
};

export type StudentBillingSummary = {
  billingMonth: string;
  status: BillingStatus;
  statusLabel: string;
  amount: number;
  paidAmount: number;
  unpaidAmount: number;
  hasInvoice: boolean;
  canGenerateCurrentMonth: boolean;
};

export type StudentBillingInvoice = {
  billingId: number;
  studentProfileId: number;
  billingType: BillingType;
  billingTypeLabel: string;
  billingMonth: string;
  billingPeriodStartMonth: string;
  billingPeriodEndMonth: string;
  issuedDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  unpaidAmount: number;
  status: InvoiceBillingStatus;
  statusLabel: string;
  memo: string | null;
};

export type StudentBillingInvoiceCreateRequest = {
  billingType: BillingType;
  billingPeriodStartMonth: string;
  billingPeriodEndMonth: string;
  dueDate: string;
  amount: number;
  memo?: string | null;
};

export const billingTypeLabels: Record<BillingType, string> = {
  REGULAR: "정규 수강료",
  PREPAID: "3개월 선납",
  MAKEUP: "보강비",
  TEXTBOOK: "교재비",
  ETC: "기타",
};

export type EnsureCurrentStudentBillingInvoiceResponse = {
  generated: boolean;
  message: string;
  invoice: StudentBillingInvoice | null;
};

export type StudentBillingInvoiceUpdateRequest = {
  amount: number;
  memo?: string | null;
};

export type StudentBillingPaymentRequest = {
  paymentAmount: number;
  paymentDate: string;
  memo?: string | null;
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
