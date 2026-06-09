"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  ApiError,
  cancelStudentBillingInvoice,
  createStudentBillingPayment,
  ensureCurrentStudentBillingInvoice,
  getStudentBillingInvoices,
  getStudentBillingSetting,
  getStudentBillingSummary,
  saveStudentBillingSetting,
  updateStudentBillingInvoice,
} from "@/lib/api";
import {
  billingStatusLabels,
  billingStatusStyles,
  type BillingStatus,
  type StudentBillingInvoice,
  type StudentBillingSetting,
  type StudentBillingSummary,
} from "@/types/billing";

const BILLING_EVENT = "ringdu:billing-updated";

type StudentBillingPanelProps = {
  studentProfileId: number;
  accessToken: string | null;
};

export function StudentBillingPanel({ studentProfileId, accessToken }: StudentBillingPanelProps) {
  const [setting, setSetting] = useState<StudentBillingSetting | null>(null);
  const [summary, setSummary] = useState<StudentBillingSummary | null>(null);
  const [invoices, setInvoices] = useState<StudentBillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingSetting, setIsEditingSetting] = useState(false);
  const [tuitionInput, setTuitionInput] = useState("0");
  const [dueDayInput, setDueDayInput] = useState("1");
  const [settingMemo, setSettingMemo] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState<StudentBillingInvoice | null>(null);
  const [amountInvoice, setAmountInvoice] = useState<StudentBillingInvoice | null>(null);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const ensureAttemptRef = useRef<number | null>(null);

  const loadBilling = useCallback(async (allowEnsure: boolean) => {
    if (!accessToken) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const today = new Date();
      const [nextSetting, nextSummary, nextInvoices] = await Promise.all([
        getStudentBillingSetting(studentProfileId, accessToken),
        getStudentBillingSummary(studentProfileId, today.getFullYear(), today.getMonth() + 1, accessToken),
        getStudentBillingInvoices(studentProfileId, accessToken, today.getFullYear()),
      ]);

      let resolvedSummary = nextSummary;
      let resolvedInvoices = nextInvoices;
      const shouldEnsure = allowEnsure
        && nextSetting.configured
        && today.getDate() >= nextSetting.dueDay
        && !nextSummary.hasInvoice
        && ensureAttemptRef.current !== studentProfileId;

      if (shouldEnsure) {
        ensureAttemptRef.current = studentProfileId;
        const ensured = await ensureCurrentStudentBillingInvoice(studentProfileId, accessToken);
        setNotice(ensured.message);
        [resolvedSummary, resolvedInvoices] = await Promise.all([
          getStudentBillingSummary(studentProfileId, today.getFullYear(), today.getMonth() + 1, accessToken),
          getStudentBillingInvoices(studentProfileId, accessToken, today.getFullYear()),
        ]);
      }

      setSetting(nextSetting);
      setSummary(resolvedSummary);
      setInvoices(resolvedInvoices);
      setTuitionInput(String(nextSetting.monthlyTuition));
      setDueDayInput(String(nextSetting.dueDay));
      setSettingMemo(nextSetting.memo ?? "");
      setIsEditingSetting(!nextSetting.configured);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, studentProfileId]);

  useEffect(() => {
    ensureAttemptRef.current = null;
    let active = true;
    void Promise.resolve().then(() => {
      if (active) return loadBilling(true);
    });
    return () => {
      active = false;
    };
  }, [loadBilling]);

  const refreshAfterMutation = async (message: string) => {
    setNotice(message);
    await loadBilling(false);
    window.dispatchEvent(new CustomEvent(BILLING_EVENT, { detail: studentProfileId }));
  };

  const saveSetting = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!accessToken) return;
    const monthlyTuition = Number(tuitionInput);
    const dueDay = Number(dueDayInput);
    if (!Number.isFinite(monthlyTuition) || monthlyTuition < 0 || dueDay < 1 || dueDay > 28) {
      setErrorMessage("월 수강료와 1~28일 사이의 수납 기준일을 확인해 주세요.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");
    try {
      const saved = await saveStudentBillingSetting(
        studentProfileId,
        { monthlyTuition, dueDay, memo: settingMemo.trim() || null },
        accessToken,
      );
      setSetting(saved);
      setIsEditingSetting(false);
      ensureAttemptRef.current = null;
      await loadBilling(true);
      setNotice("수납 설정을 저장했습니다.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const generateCurrentInvoice = async () => {
    if (!accessToken) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      const result = await ensureCurrentStudentBillingInvoice(studentProfileId, accessToken);
      ensureAttemptRef.current = studentProfileId;
      await refreshAfterMutation(result.message);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const cancelInvoice = async (invoice: StudentBillingInvoice) => {
    if (!accessToken || !window.confirm(`${formatBillingMonth(invoice.billingMonth)} 청구를 취소할까요?`)) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await cancelStudentBillingInvoice(studentProfileId, invoice.billingId, accessToken);
      await refreshAfterMutation("청구를 취소했습니다.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !setting) {
    return <p className="text-sm font-semibold text-slate-500">청구 정보를 불러오고 있습니다.</p>;
  }

  const currentStatus = summary?.status ?? "NOT_ISSUED";
  const canGenerate = Boolean(setting?.configured && summary?.canGenerateCurrentMonth && !summary.hasInvoice);

  return (
    <div className="min-w-0 space-y-5">
      <header>
        <h3 className="text-lg font-bold text-slate-950">청구/수납 관리</h3>
        <p className="mt-1 text-sm leading-6 text-slate-600">월 수강료와 청구별 수납 현황을 학생 단위로 관리합니다.</p>
      </header>

      {notice ? <Message tone="info">{notice}</Message> : null}
      {errorMessage ? <Message tone="error">{errorMessage}</Message> : null}

      <section aria-labelledby="billing-summary-title">
        <h4 id="billing-summary-title" className="text-sm font-bold text-slate-900">이번 달 요약</h4>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Summary label="상태" value={<BillingStatusBadge status={currentStatus} />} />
          <Summary label="청구 금액" value={formatWon(summary?.amount ?? 0)} />
          <Summary label="수납 금액" value={formatWon(summary?.paidAmount ?? 0)} />
          <Summary label="미납 금액" value={formatWon(summary?.unpaidAmount ?? 0)} emphasis={(summary?.unpaidAmount ?? 0) > 0} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-bold text-slate-950">수납 설정</h4>
            <p className="mt-1 text-sm leading-6 text-slate-600">수납 기준일은 매월 1일부터 28일까지 설정할 수 있습니다.</p>
          </div>
          {!isEditingSetting ? (
            <button type="button" onClick={() => setIsEditingSetting(true)} className={secondaryButtonClass}>
              수강료 수정
            </button>
          ) : null}
        </div>

        {isEditingSetting ? (
          <form onSubmit={saveSetting} className="mt-4 grid gap-4">
            <div className="grid gap-4 min-[420px]:grid-cols-2">
              <BillingField label="월 수강료">
                <input
                  inputMode="numeric"
                  value={tuitionInput}
                  onChange={(event) => setTuitionInput(event.target.value.replace(/[^0-9]/g, ""))}
                  className={inputClassName}
                />
                <p className="mt-1 text-xs font-semibold text-slate-500">{formatWon(Number(tuitionInput || 0))}</p>
              </BillingField>
              <BillingField label="수납 기준일">
                <select value={dueDayInput} onChange={(event) => setDueDayInput(event.target.value)} className={inputClassName}>
                  {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                    <option key={day} value={day}>매월 {day}일</option>
                  ))}
                </select>
              </BillingField>
            </div>
            <BillingField label="메모">
              <textarea
                value={settingMemo}
                onChange={(event) => setSettingMemo(event.target.value)}
                rows={3}
                className={`${inputClassName} h-auto py-3`}
              />
            </BillingField>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={isSaving} className={primaryButtonClass}>저장</button>
              {setting?.configured ? (
                <button type="button" onClick={() => setIsEditingSetting(false)} className={secondaryButtonClass}>취소</button>
              ) : null}
            </div>
          </form>
        ) : setting?.configured ? (
          <div className="mt-4 grid gap-3 min-[420px]:grid-cols-2">
            <SettingValue label="월 수강료" value={formatWon(setting.monthlyTuition)} />
            <SettingValue label="수납 기준일" value={`매월 ${setting.dueDay}일`} />
            <div className="min-[420px]:col-span-2">
              <SettingValue label="메모" value={setting.memo || "메모 없음"} />
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
          <div>
            <h4 className="font-bold text-amber-950">이번 달 청구</h4>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              {!setting?.configured
                ? "월 수강료와 수납 기준일을 먼저 설정해 주세요."
                : summary?.hasInvoice
                  ? "이미 이번 달 청구가 생성되어 있습니다."
                  : canGenerate
                    ? "수납 기준일이 도래해 이번 달 청구를 생성할 수 있습니다."
                    : `매월 ${setting.dueDay}일 이후 현재 월 청구가 생성됩니다.`}
            </p>
          </div>
          {canGenerate ? (
            <button type="button" disabled={isSaving} onClick={generateCurrentInvoice} className={`${primaryButtonClass} w-full min-[420px]:w-auto`}>
              이번 달 청구 생성
            </button>
          ) : null}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold text-slate-950">청구 내역</h4>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{invoices.length}건</span>
        </div>
        {invoices.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <p className="font-bold text-slate-900">선택한 기간의 청구 내역이 없습니다.</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">수납 설정을 저장하면 기준일 이후 현재 월 청구가 생성됩니다.</p>
          </div>
        ) : (
          <InvoiceList
            invoices={invoices}
            disabled={isSaving}
            onPayment={setPaymentInvoice}
            onEditAmount={setAmountInvoice}
            onCancel={cancelInvoice}
          />
        )}
      </section>

      {paymentInvoice && accessToken ? (
        <PaymentModal
          invoice={paymentInvoice}
          disabled={isSaving}
          onClose={() => setPaymentInvoice(null)}
          onSave={async (paymentAmount, paymentDate, memo) => {
            setIsSaving(true);
            setErrorMessage("");
            try {
              await createStudentBillingPayment(
                studentProfileId,
                paymentInvoice.billingId,
                { paymentAmount, paymentDate, memo: memo || null },
                accessToken,
              );
              setPaymentInvoice(null);
              await refreshAfterMutation("수납을 반영했습니다.");
            } catch (error) {
              setErrorMessage(getErrorMessage(error));
            } finally {
              setIsSaving(false);
            }
          }}
        />
      ) : null}

      {amountInvoice && accessToken ? (
        <AmountEditModal
          invoice={amountInvoice}
          disabled={isSaving}
          onClose={() => setAmountInvoice(null)}
          onSave={async (amount, memo) => {
            setIsSaving(true);
            setErrorMessage("");
            try {
              await updateStudentBillingInvoice(
                studentProfileId,
                amountInvoice.billingId,
                { amount, memo: memo || null },
                accessToken,
              );
              setAmountInvoice(null);
              await refreshAfterMutation("청구 금액을 수정했습니다.");
            } catch (error) {
              setErrorMessage(getErrorMessage(error));
            } finally {
              setIsSaving(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

export function BillingStatusBadge({ status }: { status: BillingStatus }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${billingStatusStyles[status]}`}>
      {billingStatusLabels[status]}
    </span>
  );
}

export function StudentBillingStatusSummary({
  studentProfileId,
  accessToken,
}: {
  studentProfileId: number;
  accessToken: string | null;
}) {
  const [status, setStatus] = useState<BillingStatus>("NOT_ISSUED");

  const refresh = useCallback(() => {
    if (!accessToken) return;
    const today = new Date();
    void getStudentBillingSummary(studentProfileId, today.getFullYear(), today.getMonth() + 1, accessToken)
      .then((response) => setStatus(response.status))
      .catch(() => setStatus("NOT_ISSUED"));
  }, [accessToken, studentProfileId]);

  useEffect(() => {
    refresh();
    const handleBillingUpdate = (event: Event) => {
      const updatedStudentId = (event as CustomEvent<number>).detail;
      if (updatedStudentId === studentProfileId) refresh();
    };
    window.addEventListener(BILLING_EVENT, handleBillingUpdate);
    return () => window.removeEventListener(BILLING_EVENT, handleBillingUpdate);
  }, [refresh, studentProfileId]);

  return <BillingStatusBadge status={status} />;
}

function InvoiceList({
  invoices,
  disabled,
  onPayment,
  onEditAmount,
  onCancel,
}: {
  invoices: StudentBillingInvoice[];
  disabled: boolean;
  onPayment: (invoice: StudentBillingInvoice) => void;
  onEditAmount: (invoice: StudentBillingInvoice) => void;
  onCancel: (invoice: StudentBillingInvoice) => void;
}) {
  return (
    <div className="mt-3 grid gap-3">
      {invoices.map((invoice) => (
        <article key={invoice.billingId} className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-4 py-4">
            <div className="min-w-0">
              <h5 className="font-bold text-slate-950">{formatBillingMonth(invoice.billingMonth)} 청구</h5>
              {invoice.memo ? <p className="mt-1 break-words text-sm leading-6 text-slate-600">{invoice.memo}</p> : null}
            </div>
            <BillingStatusBadge status={invoice.status} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-4 py-4">
            <InvoiceValue label="청구 금액" value={formatWon(invoice.amount)} />
            <InvoiceValue label="수납 금액" value={formatWon(invoice.paidAmount)} />
            <InvoiceValue label="미납 금액" value={formatWon(invoice.unpaidAmount)} emphasis={invoice.unpaidAmount > 0} />
            <InvoiceValue label="청구일" value={invoice.issuedDate} />
            <div className="col-span-2">
              <InvoiceValue label="납부 기준일" value={invoice.dueDate} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3">
            <button
              type="button"
              disabled={disabled || invoice.status === "CANCELED" || invoice.status === "PAID"}
              onClick={() => onPayment(invoice)}
              className={`${actionButtonClass} flex-1 min-w-24`}
            >
              수납 처리
            </button>
            <button
              type="button"
              disabled={disabled || invoice.status === "CANCELED"}
              onClick={() => onEditAmount(invoice)}
              className={`${actionButtonClass} flex-1 min-w-24`}
            >
              금액 수정
            </button>
            <button
              type="button"
              disabled={disabled || invoice.status === "CANCELED" || invoice.status === "PAID"}
              onClick={() => onCancel(invoice)}
              className="h-10 min-w-24 flex-1 rounded-lg border border-red-100 bg-white px-3 text-xs font-bold text-red-600 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              청구 취소
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function PaymentModal({
  invoice,
  disabled,
  onClose,
  onSave,
}: {
  invoice: StudentBillingInvoice;
  disabled: boolean;
  onClose: () => void;
  onSave: (amount: number, date: string, memo: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(invoice.unpaidAmount));
  const [date, setDate] = useState(toDateKey(new Date()));
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");

  return (
    <Modal title="수납 처리" description={`${formatBillingMonth(invoice.billingMonth)} 청구`} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(amount);
          if (!Number.isFinite(parsed) || parsed <= 0 || parsed > invoice.unpaidAmount) {
            setError(`이번 수납 금액은 1원 이상 ${formatWon(invoice.unpaidAmount)} 이하여야 합니다.`);
            return;
          }
          void onSave(parsed, date, memo.trim());
        }}
      >
        <div className="grid grid-cols-2 gap-3">
          <SettingValue label="청구 금액" value={formatWon(invoice.amount)} />
          <SettingValue label="현재 수납 금액" value={formatWon(invoice.paidAmount)} />
        </div>
        {error ? <Message tone="error">{error}</Message> : null}
        <BillingField label="이번 수납 금액">
          <input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))} className={inputClassName} />
        </BillingField>
        <BillingField label="수납일">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClassName} />
        </BillingField>
        <BillingField label="메모">
          <textarea rows={3} value={memo} onChange={(event) => setMemo(event.target.value)} className={`${inputClassName} h-auto py-3`} />
        </BillingField>
        <button type="submit" disabled={disabled} className={`${primaryButtonClass} w-full`}>수납 반영</button>
      </form>
    </Modal>
  );
}

function AmountEditModal({
  invoice,
  disabled,
  onClose,
  onSave,
}: {
  invoice: StudentBillingInvoice;
  disabled: boolean;
  onClose: () => void;
  onSave: (amount: number, memo: string) => Promise<void>;
}) {
  const [amount, setAmount] = useState(String(invoice.amount));
  const [memo, setMemo] = useState(invoice.memo ?? "");
  const [error, setError] = useState("");

  return (
    <Modal title="청구 금액 수정" description={`${formatBillingMonth(invoice.billingMonth)} 청구`} onClose={onClose}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          const parsed = Number(amount);
          if (!Number.isFinite(parsed) || parsed < invoice.paidAmount) {
            setError(`청구 금액은 현재 수납 금액 ${formatWon(invoice.paidAmount)}보다 작을 수 없습니다.`);
            return;
          }
          void onSave(parsed, memo.trim());
        }}
      >
        {error ? <Message tone="error">{error}</Message> : null}
        <BillingField label="청구 금액">
          <input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))} className={inputClassName} />
          <p className="mt-1 text-xs font-semibold text-slate-500">{formatWon(Number(amount || 0))}</p>
        </BillingField>
        <BillingField label="메모">
          <textarea rows={3} value={memo} onChange={(event) => setMemo(event.target.value)} className={`${inputClassName} h-auto py-3`} />
        </BillingField>
        <button type="submit" disabled={disabled} className={`${primaryButtonClass} w-full`}>수정 저장</button>
      </form>
    </Modal>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 sm:items-center">
      <section className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-lg bg-white shadow-2xl sm:rounded-lg">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h3 className="text-lg font-bold text-slate-950">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 text-lg text-slate-500" aria-label={`${title} 닫기`}>
            x
          </button>
        </div>
        <div className="p-5">{children}</div>
      </section>
    </div>
  );
}

function Summary({ label, value, emphasis = false }: { label: string; value: ReactNode; emphasis?: boolean }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className={`mt-2 break-words text-base font-bold ${emphasis ? "text-red-600" : "text-slate-950"}`}>{value}</div>
    </div>
  );
}

function SettingValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function InvoiceValue({ label, value, emphasis = false }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className={`mt-1 break-words text-sm font-bold ${emphasis ? "text-red-600" : "text-slate-900"}`}>{value}</p>
    </div>
  );
}

function BillingField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Message({ tone, children }: { tone: "info" | "error"; children: ReactNode }) {
  const style = tone === "error"
    ? "border-red-100 bg-red-50 text-red-700"
    : "border-blue-100 bg-blue-50 text-blue-700";
  return <p className={`rounded-lg border px-4 py-3 text-sm font-semibold ${style}`}>{children}</p>;
}

const inputClassName = "h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const primaryButtonClass = "inline-flex h-10 items-center justify-center rounded-lg bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300";
const secondaryButtonClass = "inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50";
const actionButtonClass = "h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-300";

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatBillingMonth(month: string) {
  const [year, value] = month.split("-");
  return `${year}년 ${Number(value)}월`;
}

function formatWon(amount: number) {
  return `${Math.max(amount || 0, 0).toLocaleString("ko-KR")}원`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) return error.message;
  return "청구 정보를 처리하지 못했습니다.";
}
