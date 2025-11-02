import { Fragment, useEffect, useMemo, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { nanoid } from "nanoid/non-secure";
import { useCartStore } from "../app/store";
import { ClientCard } from "../components/pos/ClientCard";
import { CartTable } from "../components/pos/CartTable";
import { ActionsPanel } from "../components/pos/ActionsPanel";
import { TotalsPanel } from "../components/pos/TotalsPanel";
import { PaymentButtons } from "../components/pos/PaymentButtons";
import { PosLineForm, LineFormResult, LineFormValues } from "../components/pos/PosLineForm";
import { Keypad } from "../components/pos/Keypad";
import { POS_SHORTCUTS } from "../lib/shortcuts";
import { formatMoney } from "../lib/money";
import { CartItem, PaymentMethod, Product } from "../features/cart/types";

export function PosPage() {
  const {
    items,
    selectedItemId,
    subtotal,
    total,
    change,
    cashGiven,
    customer,
    lastAction,
    setCashGiven,
    setCustomer,
    addProductByUpc,
    addCustomItem,
    selectItem,
    removeItem,
    moveItemUp,
    moveItemDown,
    toggleStorno,
    completePayment
  } = useCartStore((state) => ({
    items: state.items,
    selectedItemId: state.selectedItemId,
    subtotal: state.subtotal,
    total: state.total,
    change: state.change,
    cashGiven: state.cashGiven,
    customer: state.customer,
    lastAction: state.lastAction,
    setCashGiven: state.setCashGiven,
    setCustomer: state.setCustomer,
    addProductByUpc: state.addProductByUpc,
    addCustomItem: state.addCustomItem,
    selectItem: state.selectItem,
    removeItem: state.removeItem,
    moveItemUp: state.moveItemUp,
    moveItemDown: state.moveItemDown,
    toggleStorno: state.toggleStorno,
    completePayment: state.completePayment
  }));

  const [priceCheckOpen, setPriceCheckOpen] = useState(false);
  const [priceCheckCode, setPriceCheckCode] = useState("");
  const [priceCheckResult, setPriceCheckResult] = useState<CartItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const selectedItem = useMemo(() => items.find((item) => item.id === selectedItemId), [items, selectedItemId]);

  useHotkeys(
    POS_SHORTCUTS.deleteLine,
    (event) => {
      if (!selectedItemId) return;
      event.preventDefault();
      removeItem(selectedItemId);
    },
    { enableOnFormTags: true },
    [selectedItemId]
  );

  useHotkeys(
    POS_SHORTCUTS.moveUp,
    (event) => {
      if (!selectedItemId) return;
      event.preventDefault();
      moveItemUp(selectedItemId);
    },
    { enableOnFormTags: true },
    [selectedItemId]
  );

  useHotkeys(
    POS_SHORTCUTS.moveDown,
    (event) => {
      if (!selectedItemId) return;
      event.preventDefault();
      moveItemDown(selectedItemId);
    },
    { enableOnFormTags: true },
    [selectedItemId]
  );

  const handleLineAdd = (values: LineFormValues): LineFormResult => {
    if (!values.upc && !values.name) {
      return { success: false, message: "Introduceți un UPC sau denumire" };
    }

    const percentDiscount = values.valueDiscount
      ? undefined
      : values.percentDiscount ?? customer?.discountPercent;

    if (values.upc) {
      const result = addProductByUpc(values.upc, {
        qty: values.qty,
        unitPrice: values.price,
        percentDiscount,
        valueDiscount: values.valueDiscount
      });
      if (result.success) {
        setToast(`Produs adăugat: ${values.upc}`);
        return { success: true, message: "Produs adăugat" };
      }
    }

    if (!values.name || values.price === undefined) {
      return { success: false, message: "Produs negăsit" };
    }

    const product: Product = {
      id: nanoid(),
      upc: values.upc || `CUST-${Date.now()}`,
      name: values.name,
      price: values.price
    };

    addCustomItem({
      product,
      qty: values.qty,
      unitPrice: values.price,
      percentDiscount,
      valueDiscount: values.valueDiscount
    });
    setToast(`Produs manual: ${values.name}`);
    return { success: true, message: "Produs manual adăugat" };
  };

  const handleStorno = () => {
    if (!selectedItemId) return;
    toggleStorno(selectedItemId);
    setToast("Linia selectată a fost stornată");
  };

  const handlePackaging = () => {
    const product: Product = {
      id: nanoid(),
      upc: `AMB-${Date.now()}`,
      name: "Bon ambalaje",
      price: 0.5
    };
    addCustomItem({ product, qty: 1, unitPrice: 0.5 });
    setToast("Ambalaj adăugat pe bon");
  };

  const handlePayment = (method: PaymentMethod) => {
    const receipt = completePayment(method);
    if (receipt) {
      setToast(`Plată ${method} finalizată pentru ${formatMoney(receipt.total)}`);
    } else {
      setToast("Nu există produse în bon");
    }
  };

  const openPriceCheck = () => {
    setPriceCheckOpen(true);
    setPriceCheckResult(null);
    setPriceCheckCode("");
  };

  const runPriceCheck = () => {
    const code = priceCheckCode.trim();
    if (!code) {
      setPriceCheckResult(null);
      setToast("Introduceți un cod valid");
      return;
    }
    const found = items.find((item) => item.product.upc === code);
    if (found) {
      setPriceCheckResult(found);
    } else {
      setPriceCheckResult(null);
      setToast("Produsul nu se află în bonul curent");
    }
  };

  const handleExit = () => {
    setToast("Ieșire din POS (operațiune simulată)");
  };

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const handleFocusIn = (event: Event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        if (target.readOnly || target.disabled || target.type === "hidden") {
          return;
        }
        setKeyboardOpen(true);
      }
    };
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  const toggleKeyboard = () => {
    setKeyboardOpen((prev) => {
      const next = !prev;
      setToast(next ? "Tastatura pe ecran activată" : "Tastatura pe ecran închisă");
      return next;
    });
  };

  const closeKeyboard = () => {
    setKeyboardOpen(false);
    setToast("Tastatura pe ecran închisă");
  };

  return (
    <main className="min-h-screen bg-slate-100 p-6 lg:p-10">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">masterPOS</p>
            <h1 className="text-3xl font-semibold text-slate-900">Bon fiscal</h1>
          </div>
          <div className="text-sm text-gray-500 text-right">
            <p>{new Date().toLocaleString("ro-RO")}</p>
            {lastAction && <p className="text-indigo-600">{lastAction}</p>}
            {toast && <p className="text-emerald-600">{toast}</p>}
          </div>
        </header>
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-4 flex flex-col gap-6">
            <ClientCard value={customer} onChange={setCustomer} />
           
            <TotalsPanel
              subtotal={subtotal}
              total={total}
              change={change}
              cashGiven={cashGiven}
              onCashChange={setCashGiven}
            />
            <PaymentButtons
              onPayCash={() => handlePayment("cash")}
              onPayCard={() => handlePayment("card")}
              onPayMixed={() => handlePayment("mixed")}
              onPayModern={() => handlePayment("modern")}
              onExit={handleExit}
            />
          </div>
          <div className="col-span-12 xl:col-span-8 flex gap-6">
            <div className="flex-1">
              <CartTable
                items={items}
                selectedId={selectedItemId}
                onSelect={selectItem}
                onDelete={removeItem}
                onMoveUp={moveItemUp}
                onMoveDown={moveItemDown}
              />
            </div>
            <div className="w-full max-w-xs">
              <ActionsPanel
                onMoveUp={() => selectedItemId && moveItemUp(selectedItemId)}
                onMoveDown={() => selectedItemId && moveItemDown(selectedItemId)}
                onPriceCheck={openPriceCheck}
                onDelete={() => selectedItemId && removeItem(selectedItemId)}
                onAddPackaging={handlePackaging}
                onToggleKeyboard={toggleKeyboard}
                onExit={handleExit}
                hasSelection={Boolean(selectedItemId)}
              />
            </div>
          </div>
        </div>
      </div>

      <Keypad open={keyboardOpen} onClose={closeKeyboard} />

      {priceCheckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Verifică preț</h2>
              <button className="text-gray-500" onClick={() => setPriceCheckOpen(false)}>
                ✕
              </button>
            </header>
            <div className="flex gap-2">
              <input
                value={priceCheckCode}
                onChange={(event) => setPriceCheckCode(event.target.value)}
                className="h-12 flex-1 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/40"
                placeholder="UPC"
                inputMode="decimal"
                data-keyboard="numeric"
              />
              <button
                type="button"
                onClick={runPriceCheck}
                className="h-12 rounded-xl bg-indigo-600 px-4 font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Caută
              </button>
            </div>
            <div className="mt-4">
              {priceCheckResult ? (
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <Fragment>
                    <dt className="text-gray-500">Denumire</dt>
                    <dd className="font-semibold text-slate-900">{priceCheckResult.product.name}</dd>
                    <dt className="text-gray-500">UPC</dt>
                    <dd className="font-mono text-slate-700">{priceCheckResult.product.upc}</dd>
                    <dt className="text-gray-500">Cantitate</dt>
                    <dd>{priceCheckResult.qty.toFixed(2)}</dd>
                    <dt className="text-gray-500">Preț unitate</dt>
                    <dd>{priceCheckResult.unitPrice.toFixed(2)} RON</dd>
                  </Fragment>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">Introduceți un cod și apăsați Caută pentru a verifica.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
