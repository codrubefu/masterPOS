import { ChangeEvent, useRef, useEffect, useState } from "react";
import clsx from "clsx";
import { Customer } from "../../features/cart/types";

interface ClientCardProps {
  value?: Customer;
  /**
   * Handler for customer updates. Should be an async function that:
   * 1. Shows loading state
   * 2. Calls store's setCustomer (which handles API call)
   * 3. Shows success/error feedback
   * Similar pattern to handleProductAdd in CartTable
   */
  onChange?: (customer: Customer) => void;
}

export function ClientCard({ value, onChange }: ClientCardProps) {
  // Local state for card ID search
  const [searchCardId, setSearchCardId] = useState("");
  
  // Refs for all inputs
  const idRef = useRef<HTMLInputElement | null>(null);
  const lastNameRef = useRef<HTMLInputElement | null>(null);
  const firstNameRef = useRef<HTMLInputElement | null>(null);
  const discountPercentRef = useRef<HTMLInputElement | null>(null);
  const nrAutoRef = useRef<HTMLInputElement | null>(null);
  
  const customer = value ?? {
    id: "temp",
    type: "pf" as const,
    lastName: "Persoană fizică",
    firstName: "1",
    cardId: "",
    discountPercent: 0,
    nrAuto: ""
  };

  const handleChange = (field: keyof Customer) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!onChange) return;
    
    let fieldValue: any = event.target.value;
    if (field === "discountPercent") {
      fieldValue = Number(fieldValue) || 0;
    }
    
    onChange({ ...customer, [field]: fieldValue });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Trigger the search by calling onChange with the search ID
      if (onChange && searchCardId.trim()) {
        onChange({ ...customer, id: searchCardId.trim() });
      }
      
      // Close the onscreen keyboard by blurring the input
      event.currentTarget.blur();
    }
  };

  // --- Sync state with native input events (for onscreen keyboard) ---
  useEffect(() => {
    if (!onChange) return;
    
    const refs = [
      { ref: lastNameRef, field: "lastName" as keyof Customer },
      { ref: firstNameRef, field: "firstName" as keyof Customer },
      { ref: discountPercentRef, field: "discountPercent" as keyof Customer },
      { ref: nrAutoRef, field: "nrAuto" as keyof Customer },
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

  // Sync searchCardId with native input events (for onscreen keyboard)
  useEffect(() => {
    const input = idRef.current;
    if (!input) return;
    const handleNativeInput = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setSearchCardId(e.target.value);
      }
    };
    input.addEventListener('input', handleNativeInput);
    return () => {
      input.removeEventListener('input', handleNativeInput);
    };
  }, []);

  return (
    <section className="rounded-2xl bg-white shadow-card p-5 flex flex-col gap-4 mb-6">

      <div className="grid grid-cols-1 gap-4 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">CUI</span>
          <input
            ref={idRef}
            type="text"
            inputMode="text"
            data-keyboard="text"
            value={searchCardId}
            onChange={(event) => setSearchCardId(event.target.value)}
            onKeyDown={handleKeyDown}
            className={inputClassName}
            placeholder="Caută cui..."
          />
        </label>
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
        <label className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-gray-500">Nume</span>
          <input
            ref={lastNameRef}
            value={customer.lastName ?? ""}
            readOnly
            className={clsx(inputClassName, "bg-gray-50")}
            data-keyboard="text"
            placeholder="Nume client "
            disabled
          />
        </label>
        <label className="flex flex-col gap-1"> 
          <span className="text-xs uppercase tracking-wide text-gray-500">Nr. Auto</span>
          <input
            ref={nrAutoRef}
            value={customer.nrAuto ?? ""}
            onChange={handleChange("nrAuto")}
            className={inputClassName}
            data-keyboard="text"
            placeholder="Nr. auto"
          />
        </label>
      </div>
    </section>
  );
}

const inputClassName = "h-12 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/50";
