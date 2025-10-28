import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { useHotkeys } from "react-hotkeys-hook";
import { CartItem, Product } from "../../features/cart/types";
import { parseNumericInput } from "../../lib/money";
import { POS_SHORTCUTS } from "../../lib/shortcuts";
import { searchProducts } from "../../mocks/products";

export interface LineFormValues {
  upc: string;
  qty: number;
  price?: number;
  name?: string;
  percentDiscount?: number;
  valueDiscount?: number;
}

export interface LineFormResult {
  success: boolean;
  message?: string;
}

interface PosLineFormProps {
  onAdd: (values: LineFormValues) => LineFormResult;
  selected?: CartItem;
  subtotal: number;
  onToggleStorno: () => void;
  defaultDiscount?: number;
}

export function PosLineForm({
  onAdd,
  selected,
  subtotal,
  onToggleStorno,
  defaultDiscount
}: PosLineFormProps) {
  const upcRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [useValueDiscount, setUseValueDiscount] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    upc: "",
    qty: "1",
    price: "",
    name: "",
    percentDiscount: defaultDiscount !== undefined ? String(defaultDiscount) : "0",
    valueDiscount: ""
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (defaultDiscount !== undefined) {
      setForm((prev) => ({ ...prev, percentDiscount: String(defaultDiscount) }));
    }
  }, [defaultDiscount]);

  useEffect(() => {
    upcRef.current?.focus();
  }, []);

  useHotkeys(
    POS_SHORTCUTS.focusUpc,
    (event) => {
      event.preventDefault();
      upcRef.current?.focus();
      upcRef.current?.select();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    POS_SHORTCUTS.focusQty,
    (event) => {
      event.preventDefault();
      qtyRef.current?.focus();
      qtyRef.current?.select();
    },
    { enableOnFormTags: true }
  );

  useHotkeys(
    POS_SHORTCUTS.focusPrice,
    (event) => {
      event.preventDefault();
      priceRef.current?.focus();
      priceRef.current?.select();
    },
    { enableOnFormTags: true }
  );

  const suggestions = useMemo(() => searchProducts(searchTerm).slice(0, 5), [searchTerm]);

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const qty = Math.max(parseNumericInput(form.qty) || 1, 0.001);
    const rawPrice = parseNumericInput(form.price);
    const price = form.price ? rawPrice : undefined;
    const rawPercent = parseNumericInput(form.percentDiscount);
    const rawValueDiscount = parseNumericInput(form.valueDiscount);

    const values: LineFormValues = {
      upc: form.upc.trim(),
      qty,
      price,
      name: form.name.trim() || undefined,
      percentDiscount: !useValueDiscount && rawPercent > 0 ? rawPercent : undefined,
      valueDiscount: useValueDiscount && rawValueDiscount > 0 ? rawValueDiscount : undefined
    };

    const result = onAdd(values);
    setMessage(result.message ?? null);
    if (result.success) {
      setForm((prev) => ({
        ...prev,
        upc: "",
        qty: "1",
        name: "",
        price: "",
        valueDiscount: "",
        percentDiscount: defaultDiscount !== undefined ? String(defaultDiscount) : prev.percentDiscount
      }));
      upcRef.current?.focus();
    }
  };

  const handleSuggestion = (product: Product) => {
    setForm((prev) => ({
      ...prev,
      upc: product.upc,
      name: product.name,
      price: String(product.price)
    }));
    setSearchTerm(product.name);
    upcRef.current?.focus();
  };

  const inputClass = "h-12 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/40";
  const buttonClass = "h-12 rounded-2xl bg-slate-900 text-white font-semibold text-sm px-4 flex items-center justify-center shadow-sm hover:bg-slate-800 transition";

  return (
    <section className="rounded-2xl bg-white shadow-card p-5 flex flex-col gap-4">
      <form className="grid grid-cols-6 gap-4 text-sm" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs uppercase tracking-wide text-gray-500">UPC</span>
          <input
            ref={upcRef}
            value={form.upc}
            onChange={(event) => setForm((prev) => ({ ...prev, upc: event.target.value }))}
            className={inputClass}
            placeholder="Scanați codul"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Cantitate</span>
          <input
            ref={qtyRef}
            value={form.qty}
            onChange={(event) => setForm((prev) => ({ ...prev, qty: event.target.value }))}
            className={inputClass}
            inputMode="decimal"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Preț</span>
          <input
            ref={priceRef}
            value={form.price}
            onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
            className={inputClass}
            inputMode="decimal"
          />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs uppercase tracking-wide text-gray-500">Denumire</span>
          <input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className={inputClass}
            placeholder="Adăugați o denumire"
          />
        </label>
        <label className="flex flex-col gap-1 col-span-3">
          <span className="text-xs uppercase tracking-wide text-gray-500">Căutare produs</span>
          <input
            ref={searchRef}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={inputClass}
            placeholder="Introduceți denumire sau cod"
          />
          {searchTerm && suggestions.length > 0 && (
            <ul className="mt-2 rounded-xl border border-gray-200 bg-white shadow-sm divide-y">
              {suggestions.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-indigo-50"
                    onClick={() => handleSuggestion(product)}
                  >
                    <p className="font-medium text-slate-900">{product.name}</p>
                    <p className="text-xs text-gray-500">UPC: {product.upc}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">
            {useValueDiscount ? "Reducere valorică" : "Reducere %"}
          </span>
          <div className="flex gap-2">
            <input
              value={useValueDiscount ? form.valueDiscount : form.percentDiscount}
              onChange={(event) =>
                setForm((prev) =>
                  useValueDiscount
                    ? { ...prev, valueDiscount: event.target.value }
                    : { ...prev, percentDiscount: event.target.value }
                )
              }
              className={inputClass}
              inputMode="decimal"
            />
            <button
              type="button"
              className="h-12 px-3 rounded-xl border border-gray-200 text-xs uppercase tracking-wide"
              onClick={() => setUseValueDiscount((prev) => !prev)}
            >
              {useValueDiscount ? "-%" : "Valoric"}
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 col-span-2">
          <span className="text-xs uppercase tracking-wide text-gray-500">Acțiuni rapide</span>
          <div className="grid grid-cols-3 gap-2">
            <button type="button" className={secondaryButtonClass} onClick={() => upcRef.current?.focus()}>
              UPC
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => qtyRef.current?.focus()}>
              Cantitate
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => priceRef.current?.focus()}>
              Preț
            </button>
            <button type="button" className={secondaryButtonClass}>
              Cod fiscal
            </button>
            <button type="button" className={secondaryButtonClass} onClick={() => searchRef.current?.focus()}>
              Căutare
            </button>
            <button type="button" className={secondaryButtonClass} onClick={onToggleStorno} disabled={!selected}>
              Storno
            </button>
          </div>
        </div>
        <div className="flex flex-col justify-end gap-3 col-span-2">
          <button type="submit" className={buttonClass}>
            Adaugă produs (Enter)
          </button>
          <button type="button" className={clsx(buttonClass, "bg-indigo-600 hover:bg-indigo-500")}
            onClick={() => setMessage(`Subtotal curent: ${subtotal.toFixed(2)} RON`)}
          >
            Subtotal
          </button>
        </div>
      </form>
      {message && <p className="text-sm text-indigo-600">{message}</p>}
    </section>
  );
}

const secondaryButtonClass = "h-10 rounded-xl border border-gray-200 text-xs font-semibold uppercase tracking-wide text-gray-600 hover:border-brand-indigo hover:text-brand-indigo transition";
