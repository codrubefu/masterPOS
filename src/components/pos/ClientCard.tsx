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

  return (
    <section className="rounded-2xl bg-white shadow-card p-5 flex flex-col gap-4 mb-6">
      <div className="grid grid-cols-1 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Tip client</span>
          <input
            disabled
            readOnly
            type="text"
            value={customer.type === "pf" ? "Persoană fizică" : "Persoană juridică"}
            className={clsx(inputClassName, "bg-gray-50")}
          />
        </label>
      </div>
    </section>
  );
}

const inputClassName = "h-12 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/50";
