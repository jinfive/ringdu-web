"use client";

import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  billingStatusLabels,
  billingStatusStyles,
  type BillingStatus,
  type StudentBillingInvoice,
  type StudentBillingState,
} from "@/types/billing";

const BILLING_EVENT = "ringdu:billing-updated";

export function StudentBillingPanel({ studentProfileId }: { studentProfileId: number }) {
  const [state, setState] = useState<StudentBillingState>(() => createInitialState(studentProfileId));
  const [isReady, setIsReady] = useState(false);
  const [isEditingSetting, setIsEditingSetting] = useState(false);
  const [tuitionInput, setTuitionInput] = useState("300000");
  const [dueDayInput, setDueDayInput] = useState("1");
  const [settingMemo, setSettingMemo] = useState("");
  const [paymentInvoice, setPaymentInvoice] = useState<StudentBillingInvoice | null>(null);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    void Promise.resolve().then(() => {
      if (!isMounted) return;
      const loaded = readBillingState(studentProfileId);
      setState(loaded);
      setTuitionInput(String(loaded.setting.monthlyTuition));
      setDueDayInput(String(loaded.setting.dueDay));
      setSettingMemo(loaded.setting.memo ?? "");
      setIsReady(true);
    });
    return () => {
      isMounted = false;
    };
  }, [studentProfileId]);

  const today = useMemo(() => new Date(), []);
  const monthKey = toMonthKey(today);
  const currentInvoice = state.invoices.find((invoice) => invoice.billingMonth === monthKey) ?? null;
  const currentStatus: BillingStatus = currentInvoice?.status ?? "NOT_ISSUED";
  const issuedAmount = currentInvoice?.amount ?? 0;
  const paidAmount = currentInvoice?.paidAmount ?? 0;
  const unpaidAmount = currentInvoice?.status === "CANCELED" ? 0 : Math.max(issuedAmount - paidAmount, 0);
  const dueReached = today.getDate() >= state.setting.dueDay;

  const saveState = (next: StudentBillingState, message?: string) => {
    setState(next);
    writeBillingState(next);
    if (message) setNotice(message);
  };

  const saveSetting = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const monthlyTuition = Number(tuitionInput.replaceAll(",", ""));
    const dueDay = Number(dueDayInput);
    if (!Number.isFinite(monthlyTuition) || monthlyTuition < 0 || dueDay < 1 || dueDay > 28) {
      setNotice("월 수강료와 1~28일 사이의 수납 기준일을 확인해 주세요.");
      return;
    }
    saveState({
      ...state,
      setting: { studentProfileId, monthlyTuition, dueDay, memo: settingMemo.trim() || undefined },
    }, "수납 설정을 저장했습니다.");
    setIsEditingSetting(false);
  };

  const generateInvoice = () => {
    if (currentInvoice) {
      setNotice(`이미 ${formatBillingMonth(monthKey)} 청구가 생성되어 있습니다.`);
      return;
    }
    if (state.setting.monthlyTuition <= 0) {
      setNotice("월 수강료를 먼저 설정해 주세요.");
      return;
    }
    const issuedDate = toDateKey(today);
    const invoice: StudentBillingInvoice = {
      billingId: state.nextBillingId,
      studentProfileId,
      billingMonth: monthKey,
      issuedDate,
      dueDay: state.setting.dueDay,
      dueDate: `${monthKey}-${String(state.setting.dueDay).padStart(2, "0")}`,
      amount: state.setting.monthlyTuition,
      paidAmount: 0,
      status: "UNPAID",
      memo: state.setting.memo,
    };
    saveState({ ...state, invoices: [invoice, ...state.invoices], nextBillingId: state.nextBillingId + 1 }, `${formatBillingMonth(monthKey)} 청구를 생성했습니다.`);
  };

  const updateInvoice = (billingId: number, updater: (invoice: StudentBillingInvoice) => StudentBillingInvoice, message: string) => {
    saveState({ ...state, invoices: state.invoices.map((invoice) => invoice.billingId === billingId ? updater(invoice) : invoice) }, message);
  };

  const editAmount = (invoice: StudentBillingInvoice) => {
    const value = window.prompt("수정할 청구 금액을 입력해 주세요.", String(invoice.amount));
    if (value === null) return;
    const amount = Number(value.replaceAll(",", ""));
    if (!Number.isFinite(amount) || amount < 0) {
      setNotice("청구 금액을 숫자로 입력해 주세요.");
      return;
    }
    updateInvoice(invoice.billingId, (item) => ({ ...item, amount, status: getPaymentStatus(item.paidAmount, amount) }), "청구 금액을 수정했습니다.");
  };

  const cancelInvoice = (invoice: StudentBillingInvoice) => {
    if (!window.confirm(`${formatBillingMonth(invoice.billingMonth)} 청구를 취소할까요?`)) return;
    updateInvoice(invoice.billingId, (item) => ({ ...item, status: "CANCELED" }), "청구를 취소했습니다.");
  };

  if (!isReady) {
    return <p className="text-sm font-semibold text-slate-500">청구 정보를 준비하고 있습니다.</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-950">청구/수납 관리</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">학생별 월 수강료와 수납 상태를 관리합니다.</p>
        </div>
        {dueReached && !currentInvoice ? (
          <button type="button" onClick={generateInvoice} className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800">
            이번 달 청구 생성
          </button>
        ) : null}
      </div>

      {notice ? <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{notice}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Summary label="이번 달 청구 상태" value={<BillingStatusBadge status={currentStatus} />} />
        <Summary label="이번 달 청구 금액" value={formatWon(issuedAmount)} />
        <Summary label="수납 완료 금액" value={formatWon(paidAmount)} />
        <Summary label="미납 금액" value={formatWon(unpaidAmount)} emphasis={unpaidAmount > 0} />
      </div>

      {dueReached && !currentInvoice ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-900">이번 달 청구 생성이 필요합니다.</p>
          <p className="mt-1 text-sm leading-6 text-amber-800">수납 기준일인 매월 {state.setting.dueDay}일이 지났습니다. 설정된 수강료로 청구를 생성해 주세요.</p>
        </section>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h4 className="font-bold text-slate-950">수납 설정</h4>
            <p className="mt-1 text-sm text-slate-600">자동 생성 기준을 미리 설정합니다. 현재는 화면 시뮬레이션만 동작합니다.</p>
          </div>
          {!isEditingSetting ? <button type="button" onClick={() => setIsEditingSetting(true)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 hover:bg-slate-50">수강료 수정</button> : null}
        </div>
        {isEditingSetting ? (
          <form onSubmit={saveSetting} className="mt-4 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <BillingField label="월 수강료">
                <input inputMode="numeric" value={tuitionInput} onChange={(event) => setTuitionInput(event.target.value.replace(/[^0-9]/g, ""))} className={inputClassName} />
                <p className="mt-1 text-xs font-semibold text-slate-500">{formatWon(Number(tuitionInput || 0))}</p>
              </BillingField>
              <BillingField label="수납 기준일">
                <select value={dueDayInput} onChange={(event) => setDueDayInput(event.target.value)} className={inputClassName}>
                  {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => <option key={day} value={day}>매월 {day}일</option>)}
                </select>
              </BillingField>
            </div>
            <BillingField label="메모"><textarea value={settingMemo} onChange={(event) => setSettingMemo(event.target.value)} rows={2} className={`${inputClassName} h-auto py-3`} /></BillingField>
            <div className="flex gap-2">
              <button type="submit" className="h-10 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white">저장</button>
              <button type="button" onClick={() => setIsEditingSetting(false)} className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600">취소</button>
            </div>
          </form>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <SettingValue label="월 수강료" value={formatWon(state.setting.monthlyTuition)} />
            <SettingValue label="수납 기준일" value={`매월 ${state.setting.dueDay}일`} />
            <SettingValue label="자동 청구 상태" value="로컬 시뮬레이션" />
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h4 className="font-bold text-slate-950">청구 내역</h4>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{state.invoices.length}건</span>
        </div>
        {state.invoices.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
            <p className="font-bold text-slate-900">아직 청구 내역이 없습니다.</p>
            <p className="mt-2 text-sm text-slate-600">수납 기준일과 월 수강료를 설정한 뒤 청구를 생성해 주세요.</p>
          </div>
        ) : <InvoiceList invoices={state.invoices} onPayment={setPaymentInvoice} onEditAmount={editAmount} onCancel={cancelInvoice} />}
      </section>

      {paymentInvoice ? (
        <PaymentModal
          invoice={paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          onSave={(amount, paymentDate, memo) => {
            updateInvoice(paymentInvoice.billingId, (invoice) => {
              const nextPaidAmount = invoice.paidAmount + amount;
              return { ...invoice, paidAmount: nextPaidAmount, status: getPaymentStatus(nextPaidAmount, invoice.amount), memo: memo || invoice.memo };
            }, `${paymentDate} 수납을 반영했습니다.`);
            setPaymentInvoice(null);
          }}
        />
      ) : null}
    </div>
  );
}

export function BillingStatusBadge({ status }: { status: BillingStatus }) {
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${billingStatusStyles[status]}`}>{billingStatusLabels[status]}</span>;
}

export function StudentBillingStatusSummary({ studentProfileId }: { studentProfileId: number }) {
  const [status, setStatus] = useState<BillingStatus>("NOT_ISSUED");
  useEffect(() => {
    const refresh = () => setStatus(readCurrentBillingStatus(studentProfileId));
    refresh();
    window.addEventListener(BILLING_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(BILLING_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [studentProfileId]);
  return <BillingStatusBadge status={status} />;
}

export function readCurrentBillingStatus(studentProfileId: number): BillingStatus {
  if (typeof window === "undefined") return "NOT_ISSUED";
  const current = readBillingState(studentProfileId).invoices.find((invoice) => invoice.billingMonth === toMonthKey(new Date()));
  return current?.status ?? "NOT_ISSUED";
}

function InvoiceList({ invoices, onPayment, onEditAmount, onCancel }: { invoices: StudentBillingInvoice[]; onPayment: (invoice: StudentBillingInvoice) => void; onEditAmount: (invoice: StudentBillingInvoice) => void; onCancel: (invoice: StudentBillingInvoice) => void }) {
  return <div className="mt-3 grid gap-3">{invoices.map((invoice) => (
    <article key={invoice.billingId} className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <InvoiceValue label="청구월" value={formatBillingMonth(invoice.billingMonth)} />
          <InvoiceValue label="청구일" value={invoice.issuedDate} />
          <InvoiceValue label="수납 기준일" value={invoice.dueDate} />
          <InvoiceValue label="청구 / 수납" value={`${formatWon(invoice.amount)} / ${formatWon(invoice.paidAmount)}`} />
          <div><p className="text-xs font-bold text-slate-400">상태</p><div className="mt-1"><BillingStatusBadge status={invoice.status} /></div></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={invoice.status === "CANCELED" || invoice.status === "PAID"} onClick={() => onPayment(invoice)} className={actionButtonClass}>수납 처리</button>
          <button type="button" disabled={invoice.status === "CANCELED"} onClick={() => onEditAmount(invoice)} className={actionButtonClass}>금액 수정</button>
          <button type="button" disabled={invoice.status === "CANCELED"} onClick={() => onCancel(invoice)} className="h-9 rounded-xl border border-red-100 px-3 text-xs font-bold text-red-600 disabled:text-slate-300">청구 취소</button>
        </div>
      </div>
    </article>
  ))}</div>;
}

function PaymentModal({ invoice, onClose, onSave }: { invoice: StudentBillingInvoice; onClose: () => void; onSave: (amount: number, date: string, memo: string) => void }) {
  const [amount, setAmount] = useState(String(Math.max(invoice.amount - invoice.paidAmount, 0)));
  const [date, setDate] = useState(toDateKey(new Date()));
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-3 sm:items-center">
    <section className="w-full max-w-lg rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
      <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4"><div><h3 className="text-lg font-bold text-slate-950">수납 처리</h3><p className="mt-1 text-sm text-slate-600">{formatBillingMonth(invoice.billingMonth)} 청구</p></div><button type="button" onClick={onClose} className="h-9 w-9 rounded-xl border border-slate-200 text-slate-500" aria-label="수납 처리 닫기">x</button></div>
      <form className="grid gap-4 p-5" onSubmit={(event) => { event.preventDefault(); const parsed = Number(amount); if (!Number.isFinite(parsed) || parsed <= 0) { setError("이번 수납 금액을 확인해 주세요."); return; } onSave(parsed, date, memo.trim()); }}>
        <div className="grid gap-3 sm:grid-cols-2"><SettingValue label="청구 금액" value={formatWon(invoice.amount)} /><SettingValue label="이미 수납한 금액" value={formatWon(invoice.paidAmount)} /></div>
        {error ? <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p> : null}
        <BillingField label="이번 수납 금액"><input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ""))} className={inputClassName} /></BillingField>
        <BillingField label="수납일"><input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={inputClassName} /></BillingField>
        <BillingField label="메모"><textarea rows={3} value={memo} onChange={(event) => setMemo(event.target.value)} className={`${inputClassName} h-auto py-3`} /></BillingField>
        <button type="submit" className="h-11 rounded-xl bg-blue-700 text-sm font-bold text-white">수납 반영</button>
      </form>
    </section>
  </div>;
}

function Summary({ label, value, emphasis = false }: { label: string; value: ReactNode; emphasis?: boolean }) { return <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">{label}</p><div className={`mt-2 text-lg font-bold ${emphasis ? "text-red-600" : "text-slate-950"}`}>{value}</div></div>; }
function SettingValue({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-slate-200 bg-white px-4 py-3"><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-sm font-bold text-slate-900">{value}</p></div>; }
function InvoiceValue({ label, value }: { label: string; value: string }) { return <div><p className="text-xs font-bold text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>; }
function BillingField({ label, children }: { label: string; children: ReactNode }) { return <label className="block"><span className="text-sm font-bold text-slate-700">{label}</span><div className="mt-2">{children}</div></label>; }

const inputClassName = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100";
const actionButtonClass = "h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 disabled:text-slate-300";

function createInitialState(studentProfileId: number): StudentBillingState { return { setting: { studentProfileId, monthlyTuition: 300000, dueDay: 1, memo: "월 정규 수강료" }, invoices: [], nextBillingId: 1 }; }
function storageKey(studentProfileId: number) { return `ringdu:student-billing:${studentProfileId}`; }
function readBillingState(studentProfileId: number): StudentBillingState { if (typeof window === "undefined") return createInitialState(studentProfileId); try { const value = window.localStorage.getItem(storageKey(studentProfileId)); return value ? JSON.parse(value) as StudentBillingState : createInitialState(studentProfileId); } catch { return createInitialState(studentProfileId); } }
function writeBillingState(state: StudentBillingState) { window.localStorage.setItem(storageKey(state.setting.studentProfileId), JSON.stringify(state)); window.dispatchEvent(new CustomEvent(BILLING_EVENT, { detail: state.setting.studentProfileId })); }
function getPaymentStatus(paidAmount: number, amount: number): "UNPAID" | "PARTIAL" | "PAID" { if (paidAmount <= 0) return "UNPAID"; return paidAmount >= amount ? "PAID" : "PARTIAL"; }
function toMonthKey(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
function toDateKey(date: Date) { return `${toMonthKey(date)}-${String(date.getDate()).padStart(2, "0")}`; }
function formatBillingMonth(month: string) { const [year, value] = month.split("-"); return `${year}년 ${Number(value)}월`; }
function formatWon(amount: number) { return `${Math.max(amount || 0, 0).toLocaleString("ko-KR")}원`; }
