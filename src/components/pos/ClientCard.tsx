import clsx from "clsx";
import { Customer } from "../../features/cart/types";

interface ClientCardProps {
  value?: Customer;
  onChange?: (customer: Customer) => void;
}

export function ClientCard({ value }: ClientCardProps) {
  const customer = value ?? {
    id: "temp",
    type: "pf" as const,
    lastName: "Persoană fizică"
  };

  console.log("ClientCard render", customer);

  return (
    <section className="rounded-2xl bg-white shadow-card p-5 flex flex-col gap-4 mb-6">
      {customer.type === "pj" && (
        <div className="grid grid-cols-1 gap-4 text-sm">
          <label className="flex flex-col gap-1">Client: {customer.lastName}</label>
          <label className="flex flex-col gap-1">CUI: {customer.id}</label>
          <label className="flex flex-col gap-1">Numar auto: {customer.nrAuto}</label>
        </div>
      )}
    </section>
  );
}

const inputClassName = "h-12 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/50";
