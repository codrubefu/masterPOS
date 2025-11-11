import clsx from "clsx";
import { useRef, useEffect } from "react";
import { formatMoney, parseNumericInput } from "../../lib/money";
import { useCartStore } from "../../app/store";

interface TotalsPanelProps {
  subtotal: number;
  total: number;
  change: number;
  cashGiven: number;
  onCashChange: (value: number) => void;
}

export function TotalsPanel({ subtotal, total, change, cashGiven, onCashChange }: TotalsPanelProps) {
  const inputClass = "h-12 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/40";
  
  // Get values from store
  const codFiscal = useCartStore((state) => state.codFiscal);
  const setCodFiscal = useCartStore((state) => state.setCodFiscal);
  const bonuriValorice = useCartStore((state) => state.bonuriValorice);
  const setBonuriValorice = useCartStore((state) => state.setBonuriValorice);
  const cardAmount = useCartStore((state) => state.cardAmount);
  const setCardAmount = useCartStore((state) => state.setCardAmount);
  const numerarAmount = useCartStore((state) => state.numerarAmount);
  const setNumerarAmount = useCartStore((state) => state.setNumerarAmount);
  
  // Ref for cash given input
  const cashGivenInputRef = useRef<HTMLInputElement | null>(null);
  // Ref for cod fiscal input
  const codFiscalInputRef = useRef<HTMLInputElement | null>(null);
  // Refs for payment split inputs
  const bonuriValoriceInputRef = useRef<HTMLInputElement | null>(null);
  const cardAmountInputRef = useRef<HTMLInputElement | null>(null);
  const numerarAmountInputRef = useRef<HTMLInputElement | null>(null);

  // Sync cashGiven state with native input events (for onscreen keyboard)
  useEffect(() => {
    const input = cashGivenInputRef.current;
    if (!input) return;
    const handleNativeInput = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        onCashChange(parseNumericInput(e.target.value));
      }
    };
    input.addEventListener('input', handleNativeInput);
    return () => {
      input.removeEventListener('input', handleNativeInput);
    };
  }, [onCashChange]);

  // Sync codFiscal state with native input events (for onscreen keyboard)
  useEffect(() => {
    const input = codFiscalInputRef.current;
    if (!input) return;
    const handleNativeInput = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setCodFiscal(e.target.value);
      }
    };
    input.addEventListener('input', handleNativeInput);
    return () => {
      input.removeEventListener('input', handleNativeInput);
    };
  }, [setCodFiscal]);

  // Sync bonuriValorice state with native input events (for onscreen keyboard)
  useEffect(() => {
    const input = bonuriValoriceInputRef.current;
    if (!input) return;
    const handleNativeInput = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setBonuriValorice(parseNumericInput(e.target.value));
      }
    };
    input.addEventListener('input', handleNativeInput);
    return () => {
      input.removeEventListener('input', handleNativeInput);
    };
  }, [setBonuriValorice]);

  // Sync cardAmount state with native input events (for onscreen keyboard)
  useEffect(() => {
    const input = cardAmountInputRef.current;
    if (!input) return;
    const handleNativeInput = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setCardAmount(parseNumericInput(e.target.value));
      }
    };
    input.addEventListener('input', handleNativeInput);
    return () => {
      input.removeEventListener('input', handleNativeInput);
    };
  }, [setCardAmount]);

  // Sync numerarAmount state with native input events (for onscreen keyboard)
  useEffect(() => {
    const input = numerarAmountInputRef.current;
    if (!input) return;
    const handleNativeInput = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setNumerarAmount(parseNumericInput(e.target.value));
      }
    };
    input.addEventListener('input', handleNativeInput);
    return () => {
      input.removeEventListener('input', handleNativeInput);
    };
  }, [setNumerarAmount]);

  // Calculate the sum of payment splits
  const paymentSplitSum = bonuriValorice + cardAmount + numerarAmount;
  const difference = paymentSplitSum - total;
  const hasError = Math.abs(difference) > 0.001; // Small tolerance for floating point

  return (
    <section className="rounded-2xl bg-white shadow-card p-5 grid grid-cols-2 gap-4 text-sm">
      <div className="flex flex-col gap-1">
        {hasError && (
          <div className={clsx(
            "h-12 rounded-xl border px-3 flex items-center font-semibold",
            difference > 0 ? "bg-red-50 border-red-200 text-red-600" : "bg-amber-50 border-amber-200 text-amber-600"
          )}>
            {difference > 0 ? "+" : ""}{formatMoney(difference)}
          </div>
        )}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">Valoare totală</p>
        <p className="text-2xl font-semibold text-brand-indigo">{formatMoney(total)}</p>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Bani</span>
        <input
          ref={cashGivenInputRef}
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
        <input
          ref={codFiscalInputRef}
          className={clsx(inputClass, "bg-white")}
          value={codFiscal}
          placeholder=""
          data-keyboard="text"
          onChange={(event) => setCodFiscal(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
      </div>
      <label className="flex flex-col gap-1">
       
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Card</span>
        <input
          ref={cardAmountInputRef}
          className={clsx(inputClass, "bg-white", hasError && "border-red-300")}
          value={cardAmount}
          inputMode="decimal"
          data-keyboard="numeric"
          onChange={(event) => setCardAmount(parseNumericInput(event.target.value))}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs uppercase tracking-wide text-gray-500">Numerar</span>
        <input
          ref={numerarAmountInputRef}
          className={clsx(inputClass, "bg-white", hasError && "border-red-300")}
          value={numerarAmount}
          inputMode="decimal"
          data-keyboard="numeric"
          onChange={(event) => setNumerarAmount(parseNumericInput(event.target.value))}
        />
      </label>
    </section>
  );
}
