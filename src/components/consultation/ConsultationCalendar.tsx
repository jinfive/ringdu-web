"use client";

const weekdayLabels = ["일", "월", "화", "수", "목", "금", "토"];

type ConsultationCalendarProps = {
  visibleMonth: Date;
  selectedDate: string;
  onMonthChange: (nextMonth: Date) => void;
  onDateSelect: (date: string) => void;
  availableDates?: string[];
};

export function ConsultationCalendar({
  visibleMonth,
  selectedDate,
  onMonthChange,
  onDateSelect,
  availableDates,
}: ConsultationCalendarProps) {
  const today = toDateKey(new Date());
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const leadingDays = firstDay.getDay();
  const cells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: lastDate }, (_, index) => new Date(year, month, index + 1)),
  ];

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, month - 1, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-600 transition hover:bg-slate-50"
          aria-label="이전 월"
        >
          ‹
        </button>
        <p className="text-base font-bold text-slate-950">
          {year}년 {month + 1}월
        </p>
        <button
          type="button"
          onClick={() => onMonthChange(new Date(year, month + 1, 1))}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 text-lg font-bold text-slate-600 transition hover:bg-slate-50"
          aria-label="다음 월"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400">
        {weekdayLabels.map((label) => (
          <span key={label} className="py-2">
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, index) => {
          if (!date) {
            return <span key={`blank-${index}`} className="aspect-square" />;
          }
          const dateKey = toDateKey(date);
          const isToday = dateKey === today;
          const isSelected = dateKey === selectedDate;
          const hasAvailability = !availableDates || availableDates.includes(dateKey);

          return (
            <button
              key={dateKey}
              type="button"
              disabled={!hasAvailability}
              onClick={() => onDateSelect(dateKey)}
              className={`aspect-square rounded-2xl text-sm font-bold transition ${
                isSelected
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-100"
                  : !hasAvailability
                    ? "cursor-not-allowed text-slate-300"
                  : isToday
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100"
                    : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
