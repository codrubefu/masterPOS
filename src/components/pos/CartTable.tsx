import clsx from "clsx";
import { useState, useRef, useEffect } from "react";
import { calculateLineTotals } from "../../features/cart/utils";
import { CartItem } from "../../features/cart/types";
import { formatMoney } from "../../lib/money";
// import { useRequestKeyboard } from "../../lib/useRequestKeyboard";


export interface CartTableProps {
  items: CartItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onProductSearch: (searchTerm: string) => Promise<void>;
  onUpdateItem: (id: string, updates: Partial<CartItem>) => void;
}


export function CartTable({ items, selectedId, onSelect, onDelete, onMoveUp, onMoveDown, onProductSearch, onUpdateItem }: CartTableProps) {
  // Local state for on-screen keyboard toggle
  const [iskeyboardEnabled, setIsKeyboardEnabled] = useState(false);


  // Ref for the quantity input in the modal
  const quantityInputRef = useRef<HTMLInputElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  // Sync editQuantity state with native input events (for onscreen keyboard)
  useEffect(() => {
    if (!editModalOpen) return;
    const input = quantityInputRef.current;
    if (!input) return;
    const handleNativeInput = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setEditQuantity(e.target.value);
      }
    };
    input.addEventListener('input', handleNativeInput);
    return () => {
      input.removeEventListener('input', handleNativeInput);
    };
  }, [editModalOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onProductSearch(searchTerm);
      setSearchTerm(""); // Clear the search term after search
    }
  };

  const handleEditItem = (item: CartItem) => {
    setEditingItem(item);
    setEditQuantity(item.qty.toString());
    setEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingItem && editQuantity) {
      const newQuantity = parseFloat(editQuantity);
      if (newQuantity > 0) {
        onUpdateItem(editingItem.id, { qty: newQuantity });
        setEditModalOpen(false);
        setEditingItem(null);
        setEditQuantity("");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditModalOpen(false);
    setEditingItem(null);
    setEditQuantity("");
  };



  return (
    <section className="rounded-2xl bg-white shadow-card p-4 flex flex-col h-full overflow-hidden w-full">
      <header className="flex items-center justify-between pb-2 border-b border-slate-200 flex-shrink-0">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Bon fiscal</p>
          <h2 className="text-xl font-semibold text-slate-900">Produse scanate</h2>
        </div>
        <input 
          type ="text"
          placeholder= "Caută produs..."
          className= "border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-brand-indigo focus:border-brand-indigo"
          value = {searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onKeyDown={handleKeyDown}
          inputMode="numeric"
          data-keyboard="numeric"
          data-request={iskeyboardEnabled ? "false" : "true"}
        />

        <label htmlFor="toggleKeyboard" className="flex items-center gap-2 cursor-pointer select-none">
          <span
            className={
              iskeyboardEnabled
                ? "inline-flex items-center justify-center w-8 h-8 rounded bg-brand-indigo/10 border border-brand-indigo text-brand-indigo shadow"
                : "inline-flex items-center justify-center w-8 h-8 rounded bg-gray-100 border border-gray-300 text-gray-400"
            }
            style={{ transition: 'all 0.2s' }}
          >
            {/* Keyboard SVG icon */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="5" width="16" height="10" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="4.5" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
              <rect x="7.5" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
              <rect x="10.5" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
              <rect x="13.5" y="8" width="2" height="2" rx="0.5" fill="currentColor"/>
              <rect x="6" y="11" width="8" height="2" rx="0.5" fill="currentColor"/>
            </svg>
          </span>
          <input 
            type="checkbox"
            id="toggleKeyboard"
            checked={iskeyboardEnabled}
            data-request="true"
            onChange={() => setIsKeyboardEnabled(!iskeyboardEnabled)}
            className="sr-only" // hide the native checkbox
          />
        </label>
      </header>
   
      <div className="mt-4 flex-1 overflow-y-auto min-h-0" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditItem(item);
                          }}
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

      {/* Edit Quantity Modal */}
      {editModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Modifică Cantitatea</h2>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={handleCancelEdit}
              >
                ✕
              </button>
            </header>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Produs:</p>
              <p className="font-semibold text-slate-900">{editingItem.product.name}</p>
              <p className="text-xs text-gray-500">UPC: {editingItem.product.upc}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cantitate:
              </label>
              <input
                ref={quantityInputRef}
                type="number"
                min="1"
                step="1"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                className="w-full h-12 rounded-xl border border-gray-200 px-3 text-lg font-semibold focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/40"
                placeholder="Introduceți cantitatea"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 h-12 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
              >
                Anulează
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 h-12 rounded-xl bg-brand-indigo text-white font-semibold hover:bg-indigo-500 transition"
                disabled={!editQuantity || parseFloat(editQuantity) <= 0}
              >
                Salvează
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const rowButtonClass = "h-9 rounded-lg border border-gray-200 px-3 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:border-brand-indigo hover:text-brand-indigo transition";
