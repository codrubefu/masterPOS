import clsx from "clsx";

interface ActionsPanelProps {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onPriceCheck: () => void;
  onDelete: () => void;
  onAddPackaging: () => void;
  onToggleKeyboard: () => void;
  onExit: () => void;
  hasSelection: boolean;
}

export function ActionsPanel({
  onMoveUp,
  onMoveDown,
  onPriceCheck,
  onDelete,
  onAddPackaging,
  onToggleKeyboard,
  onExit,
  hasSelection
}: ActionsPanelProps) {
  const buttonClass = "h-12 rounded-2xl bg-slate-900 text-white font-semibold text-sm px-4 flex items-center justify-center shadow-sm hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed";
  const secondaryClass = clsx(
    "h-12 rounded-2xl border border-gray-200 bg-white text-sm font-semibold text-slate-700 px-4 hover:border-brand-indigo hover:text-brand-indigo transition",
    "disabled:opacity-40 disabled:cursor-not-allowed"
  );

  return (
    <aside className="rounded-2xl bg-white shadow-card p-4 flex flex-col gap-3">
      <button type="button" className={secondaryClass} onClick={onMoveUp} disabled={!hasSelection}>
        ↑ Mută sus
      </button>
      <button type="button" className={secondaryClass} onClick={onMoveDown} disabled={!hasSelection}>
        ↓ Mută jos
      </button>
      <button type="button" className={secondaryClass} onClick={onPriceCheck}>
        Verifică preț
      </button>
      <button type="button" className={secondaryClass} onClick={onAddPackaging}>
        Bon ambalaje
      </button>
      <button type="button" className={secondaryClass} onClick={onToggleKeyboard}>
        Tastatură
      </button>
      <button type="button" className={secondaryClass} onClick={onDelete} disabled={!hasSelection}>
        Șterge produs
      </button>
      <div className="pt-2 mt-auto border-t border-slate-200">
        <button type="button" className={buttonClass} onClick={onExit}>
          IEȘIRE
        </button>
      </div>
    </aside>
  );
}
