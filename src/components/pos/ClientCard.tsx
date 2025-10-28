import { ChangeEvent } from "react";
import clsx from "clsx";
import { Customer } from "../../features/cart/types";

interface ClientCardProps {
  value?: Customer;
  onChange: (customer: Customer) => void;
}

export function ClientCard({ value, onChange }: ClientCardProps) {
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

  return (
    <section className="rounded-2xl bg-white shadow-card p-5 flex flex-col gap-4">
      <header className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-full bg-indigo-100 text-brand-indigo flex items-center justify-center font-semibold">
          {customer.lastName?.charAt(0) ?? "C"}
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500">Client</p>
          <p className="text-lg font-semibold text-slate-900">
            {customer.lastName ?? "Persoană fizică"}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Card ID</span>
          <input
            type="number"
            inputMode="numeric"
            data-keyboard="numeric"
            value={customer.cardId ?? ""}
            onChange={handleChange("cardId")}
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
