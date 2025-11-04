import { useHotkeys } from "react-hotkeys-hook";
import { POS_SHORTCUTS } from "../../lib/shortcuts";

interface PaymentButtonsProps {
  onPayCash: () => void;
  onPayCard: () => void;
  onPayMixed: () => void;
  onPayModern: () => void;
  onExit: () => void;
  enabled?: boolean;
  setEnabled?: (enabled: boolean) => void;
}

import { useCartStore } from "../../app/store";

export function PaymentButtons({ onPayCash, onPayCard, onPayMixed, onPayModern, onExit, enabled = false, setEnabled }: PaymentButtonsProps) {
  const total = useCartStore((state) => state.total);

  useHotkeys(POS_SHORTCUTS.payCash, (event) => {
    if (!enabled) return;
    event.preventDefault();
    onPayCash();
  });
  useHotkeys(POS_SHORTCUTS.payCard, (event) => {
    if (!enabled) return;
    event.preventDefault();
    onPayCard();
  });
  useHotkeys(POS_SHORTCUTS.payMixed, (event) => {
    if (!enabled) return;
    event.preventDefault();
    onPayMixed();
  });
  useHotkeys(POS_SHORTCUTS.exit, (event) => {
    event.preventDefault();
    onExit();
  });


  const buttonClass = "h-14 rounded-2xl text-white font-semibold text-base shadow-sm transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-400";

  const handleSubTotal = () => {
    if (setEnabled) setEnabled(true);
    // Print the total to the console
    console.log("TOTAL:", total);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <button type="button" className={`${buttonClass} bg-amber-500 hover:bg-amber-400`} onClick={onPayMixed} disabled={!enabled}>
        Plata mixtă
      </button>
      <button type="button" className={`${buttonClass} bg-emerald-600 hover:bg-emerald-500`} onClick={onPayCash} disabled={!enabled}>
        Plata numerar
      </button>
      <button type="button" className={`${buttonClass} bg-indigo-600 hover:bg-indigo-500`} onClick={onPayCard} disabled={!enabled}>
        Plata card
      </button>
      <button type="button" className={`${buttonClass} bg-slate-800 hover:bg-slate-700`} onClick={onPayModern} disabled={!enabled}>
        Plata modernă
      </button>
      <button type="button" className={`${buttonClass} bg-gray-700 hover:bg-gray-600 col-span-2 lg:col-span-4`} onClick={handleSubTotal}>
        Sub Total (Total: {total})
      </button>
    </div>
  );
}
