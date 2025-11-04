import clsx from "clsx";
import { formatMoney, parseNumericInput } from "../../lib/money";

interface TotalsPanelProps {
  subtotal: number;
  total: number;
  change: number;
  cashGiven: number;
  onCashChange: (value: number) => void;
}

export function TotalsPanel({ subtotal, total, change, cashGiven, onCashChange }: TotalsPanelProps) {
  const inputClass = "h-12 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/40";

  return (
    <section className="rounded-2xl bg-white shadow-card p-5 grid grid-cols-2 gap-4 text-sm">
      <div>
      
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Valoare totală</p>
        <p className="text-2xl font-semibold text-brand-indigo">{formatMoney(total)}</p>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Bani</span>
        <input
          className={clsx(inputClass, "font-semibold text-lg")}
          value={cashGiven}
          inputMode="decimal"
          data-keyboard="numeric"
          onChange={(event) => onCashChange(parseNumericInput(event.target.value))}
        />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Rest</span>
        <div className="h-12 rounded-xl border border-gray-200 px-3 flex items-center font-semibold text-lg text-emerald-600 bg-emerald-50">
          {formatMoney(change)}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Cod fiscal</span>
        <div className="h-12 rounded-xl border border-gray-100 px-3 flex items-center bg-slate-50">RO999999</div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Bonuri valorice</span>
        <div className="h-12 rounded-xl border border-gray-100 px-3 flex items-center bg-slate-50">0.00</div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Card</span>
        <div className="h-12 rounded-xl border border-gray-100 px-3 flex items-center bg-slate-50">{formatMoney(total - cashGiven + change)}</div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Numerar</span>
        <div className="h-12 rounded-xl border border-gray-100 px-3 flex items-center bg-slate-50">{formatMoney(cashGiven)}</div>
      </div>
    </section>
  );
}
