import { ChangeEvent, useRef, useEffect } from "react";
import clsx from "clsx";
import { Customer } from "../../features/cart/types";

interface ClientCardProps {
  value?: Customer;
  onChange: (customer: Customer) => void;
}

export function ClientCard({ value, onChange }: ClientCardProps) {
  // Refs for all inputs
  const cardIdRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const discountPercentRef = useRef<HTMLInputElement | null>(null);
  const customer = value ?? {
    id: "temp",
    type: "pf" as const,
    lastName: "Persoană fizică",
    firstName: "1",
    cardId: "",
    discountPercent: 0
  };

  const handleChange = (field: keyof Customer) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value =
      field === "discountPercent"
        ? Number(event.target.value) || 0
        : field === "type"
          ? (event.target.value as Customer["type"])
          : event.target.value;
    const next: Customer = {
      ...customer,
      [field]: value as Customer[keyof Customer]
    };
    onChange(next);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      // Close the onscreen keyboard by blurring the input
      event.currentTarget.blur();
    }
  };

  // --- Sync state with native input events (for onscreen keyboard) ---
  useEffect(() => {
    const refs = [
      { ref: cardIdRef, field: "cardId" },
      { ref: lastNameRef, field: "lastName" },
      { ref: firstNameRef, field: "firstName" },
      { ref: discountPercentRef, field: "discountPercent" },
    ];
    const handlers = refs.map(({ ref, field }) => {
      const handler = (e: Event) => {
        if (e.target instanceof HTMLInputElement) {
          let value: any = e.target.value;
          if (field === "discountPercent") value = Number(value) || 0;
          onChange({ ...customer, [field]: value });
        }
      };
      ref.current?.addEventListener('input', handler);
      return { ref, handler };
    });
    return () => {
      handlers.forEach(({ ref, handler }) => {
        ref.current?.removeEventListener('input', handler);
      });
    };
  }, [customer, onChange]);

  return (
    <section className="rounded-2xl bg-white shadow-card p-5 flex flex-col gap-4 mb-6">

      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Card ID</span>
          <input
            ref={cardIdRef}
            type="number"
            inputMode="numeric"
            data-keyboard="numeric"
            value={customer.cardId ?? ""}
            onChange={handleChange("cardId")}
            onKeyDown={handleKeyDown}
            className={inputClassName}
            placeholder="Introduceți card"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Tip client</span>
          <select value={customer.type} onChange={handleChange("type")} className={inputClassName}>
            <option value="pf">Persoană fizică</option>
            <option value="pj">Persoană juridică</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Nume</span>
          <input
            ref={lastNameRef}
            value={customer.lastName ?? ""}
            onChange={handleChange("lastName")}
            className={inputClassName}
            data-keyboard="text"
            placeholder="Nume client"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Prenume / Nr. puncte</span>
          <input
            ref={firstNameRef}
            value={customer.firstName ?? ""}
            onChange={handleChange("firstName")}
            className={inputClassName}
            data-keyboard="text"
            placeholder="Prenume"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Reducere %</span>
          <input
            ref={discountPercentRef}
            type="number"
            min={0}
            max={100}
            value={customer.discountPercent ?? 0}
            onChange={handleChange("discountPercent")}
            className={clsx(inputClassName, "[appearance:textfield]")}
            data-keyboard="numeric"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">ID Intern</span>
          <div className="h-12 flex items-center rounded-xl border border-gray-200 px-3 text-sm bg-gray-50">
            {customer.id}
          </div>
        </div>
      </div>
    </section>
  );
}

const inputClassName = "h-12 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/50";
