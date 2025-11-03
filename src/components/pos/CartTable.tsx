import clsx from "clsx";
import { useState } from "react";
import { calculateLineTotals } from "../../features/cart/utils";
import { CartItem } from "../../features/cart/types";
import { formatMoney } from "../../lib/money";
import { useRequestKeyboard } from "../../lib/useRequestKeyboard";

interface CartTableProps {
  items: CartItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onProductSearch?: (searchTerm: string) => Promise<void>;
}

export function CartTable({ items, selectedId, onSelect, onDelete, onMoveUp, onMoveDown, onProductSearch }: CartTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { keyboardEnabled, toggleKeyboard } = useRequestKeyboard();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onProductSearch) {
      event.preventDefault();
      onProductSearch(searchTerm);
      setSearchTerm(""); // Clear the search term after search
    }
  };

  return (
    <section className="rounded-2xl bg-white shadow-card p-4 flex flex-col h-screen overflow-hidden w-full">
      <header className="flex items-center justify-between pb-2 border-b border-slate-200 flex-shrink-0">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Bon fiscal</p>
          <h2 className="text-xl font-semibold text-slate-900">Produse scanate</h2>
        </div>
        <div className="flex items-center gap-2">
          <input 
            type="text"   
            data-request="true"
            data-keyboard="numeric"  
            placeholder="Caută produs..." 
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-brand-indigo"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            onClick={toggleKeyboard}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              keyboardEnabled 
                ? 'bg-brand-indigo text-white border-brand-indigo' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
            title={keyboardEnabled ? "Dezactivează tastatura" : "Activează tastatura"}
          >
            ⌨️
          </button>
        </div>
      </header>
   
      <div className="mt-4 flex-1 overflow-auto min-h-0">
        <table className="w-full" role="grid">
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase text-gray-500">
            <tr>
              <th className="py-2 px-3 text-left">Articol</th>
              <th className="py-2 px-3 text-right">Cant</th>
              <th className="py-2 px-3 text-right">-%</th>
              <th className="py-2 px-3 text-right">Preț</th>
              <th className="py-2 px-3 text-right">Valoare</th>
              <th className="py-2 px-3 text-right" aria-label="Acțiuni" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400">
                  Niciun produs adăugat încă
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const totals = calculateLineTotals(item);
                const isSelected = item.id === selectedId;
                return (
                  <tr
                    key={item.id}
                    role="row"
                    aria-selected={isSelected}
                    className={clsx(
                      "transition-colors",
                      isSelected ? "bg-indigo-50/80" : "hover:bg-slate-50"
                    )}
                    onClick={() => onSelect(item.id)}
                  >
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{item.product.name}</span>
                        <span className="text-xs text-gray-500">UPC: {item.product.upc}</span>
                        {item.storno && <span className="mt-1 text-xs font-semibold text-red-500">STORNO</span>}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{item.qty.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">
                      {item.valueDiscount ? "-" : `${item.percentDiscount ?? 0}%`}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{item.unitPrice.toFixed(2)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold">
                      {formatMoney(totals.total)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(item.id);
                          }}
                          className={clsx(rowButtonClass, "bg-red-50 text-red-600 border-red-200")}
                        >
                          Șterge
                        </button>
                        <button
                          type="button"
                          className={clsx(rowButtonClass, "bg-green-50 text-green-600 border-green-200")}
                        >
                          Modifica
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const rowButtonClass = "h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:border-brand-indigo hover:text-brand-indigo transition";
