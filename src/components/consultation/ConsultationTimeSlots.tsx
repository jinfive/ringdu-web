"use client";

type ConsultationTimeSlotsProps = {
  slots: string[];
  disabledSlots: string[];
  selectedTime: string;
  onTimeSelect: (time: string) => void;
  disabledReasons?: Record<string, string>;
};

export function ConsultationTimeSlots({
  slots,
  disabledSlots,
  selectedTime,
  onTimeSelect,
  disabledReasons = {},
}: ConsultationTimeSlotsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {slots.map((slot) => {
        const disabled = disabledSlots.includes(slot);
        const selected = selectedTime === slot;

        return (
          <div key={slot}>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onTimeSelect(slot)}
              className={`h-11 w-full rounded-2xl text-sm font-bold transition ${
                selected
                  ? "bg-blue-700 text-white shadow-lg shadow-blue-100"
                  : disabled
                    ? "cursor-not-allowed bg-slate-100 text-slate-400"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {slot}
            </button>
            {disabled && disabledReasons[slot] ? (
              <p className="mt-1 text-center text-xs font-semibold text-slate-400">{disabledReasons[slot]}</p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
