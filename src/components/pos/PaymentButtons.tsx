import { useHotkeys } from "react-hotkeys-hook";
import { POS_SHORTCUTS } from "../../lib/shortcuts";

interface PaymentButtonsProps {
  onPayCash: () => void;
  onPayCard: () => void;
  onPayMixed: () => void;
  onPayModern: () => void;
  onExit: () => void;
}

export function PaymentButtons({ onPayCash, onPayCard, onPayMixed, onPayModern, onExit }: PaymentButtonsProps) {
  useHotkeys(POS_SHORTCUTS.payCash, (event) => {
    event.preventDefault();
    onPayCash();
  });
  useHotkeys(POS_SHORTCUTS.payCard, (event) => {
    event.preventDefault();
    onPayCard();
  });
  useHotkeys(POS_SHORTCUTS.payMixed, (event) => {
    event.preventDefault();
    onPayMixed();
  });
  useHotkeys(POS_SHORTCUTS.exit, (event) => {
    event.preventDefault();
    onExit();
  });

  const buttonClass = "h-14 rounded-2xl text-white font-semibold text-base shadow-sm transition active:scale-[0.99]";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <button type="button" className={`${buttonClass} bg-amber-500 hover:bg-amber-400`} onClick={onPayMixed}>
        Plata mixtă (F11)
      </button>
      <button type="button" className={`${buttonClass} bg-emerald-600 hover:bg-emerald-500`} onClick={onPayCash}>
        Plata numerar (F9)
      </button>
      <button type="button" className={`${buttonClass} bg-indigo-600 hover:bg-indigo-500`} onClick={onPayCard}>
        Plata card (F10)
      </button>
      <button type="button" className={`${buttonClass} bg-slate-800 hover:bg-slate-700`} onClick={onPayModern}>
        Plata modernă
      </button>
    </div>
  );
}
