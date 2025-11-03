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
import { useRequestKeyboard } from "../lib/useRequestKeyboard";
import { useGlobalRequestKeyboard } from "../lib/useGlobalRequestKeyboard";
import { random } from "nanoid";

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
    completePayment,
    updateItem
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
    completePayment: state.completePayment,
    updateItem: state.updateItem
  }));

  const [priceCheckOpen, setPriceCheckOpen] = useState(false);
  const [priceCheckCode, setPriceCheckCode] = useState("");
  const [priceCheckResult, setPriceCheckResult] = useState<CartItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Initialize global request keyboard functionality
  useGlobalRequestKeyboard(setKeyboardOpen);

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

  const handleAddProduct = () => {
    const demoProduct: Product = {
      id: nanoid(),
      upc: `DEMO-${Date.now()}`,
      name: "Produs Demo",
      price: 9.99
    };
    addCustomItem({ product: demoProduct, qty: 1, unitPrice: demoProduct.price });
    setToast("Produs demo adăugat în bon");
  };

  const handleProductSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setToast("Introduceți un termen de căutare");
      return;
    }

    try {
      setToast("Căutare produs...");
      
      // API call to search endpoint
      let id = Math.floor(Math.random() * 8) + 1;
      const response = await fetch(`http://localhost:8082/api/articles/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const apiResponse = await response.json();

      if (apiResponse.success && apiResponse.data) {
        // If products found, add the first one to cart
        const product = apiResponse.data;
        const result = addProductByUpc(product.upc, {
          qty: 1,
          unitPrice: product.price
        });
        
        if (result.success) {
          setToast(`Produs găsit și adăugat: ${product.name}`);
        } else {
          setToast("Produsul nu a putut fi adăugat");
        }
      } else {
        setToast("Niciun produs găsit");
      }
    } catch (error) {
      console.error('Search error:', error);
      setToast("Eroare la căutarea produsului");
    }
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
        
        // Check if this is a request input
        const isRequestInput = target.getAttribute('data-request') === 'true';
        const showOnscreenKeyboard = target.getAttribute('data-show-onscreen-keyboard') === 'true';
        
        if (isRequestInput) {
          // Only show keyboard if it's enabled for request inputs
          setKeyboardOpen(showOnscreenKeyboard);
        } else {
          // Show keyboard for all other inputs (normal behavior)
          setKeyboardOpen(true);
        }
      }
    };
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  // Global keydown handler to auto-focus search input when typing
  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if any input/textarea is already focused
      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLInputElement || 
          activeElement instanceof HTMLTextAreaElement || 
          activeElement instanceof HTMLSelectElement) {
        return;
      }
      
      // Don't intercept modifier keys, function keys, etc.
      if (event.ctrlKey || event.altKey || event.metaKey || 
          event.key.length > 1 || // Function keys, arrow keys, etc.
          event.key === ' ') { // Space key
        return;
      }
      
      // Find the search input
      const searchInput = document.querySelector('input[data-request="true"][placeholder="Caută produs..."]') as HTMLInputElement;
      
      if (searchInput) {
        // Focus the search input
        searchInput.focus();
        
        // Set the typed character as the value
        const char = event.key;
        searchInput.value = char;
        
        // Trigger the onChange event
        const changeEvent = new Event('input', { bubbles: true });
        searchInput.dispatchEvent(changeEvent);
        
        // Prevent the default behavior
        event.preventDefault();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
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

  // Wrapper function to convert partial updates to updater function
  const handleUpdateItem = (id: string, updates: Partial<CartItem>) => {
    updateItem(id, (item) => ({ ...item, ...updates }));
  };

  return (
    <main className="h-screen bg-slate-100 p-6 lg:p-2 overflow-hidden">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 h-full">
        <header className="flex items-center justify-between flex-shrink-0">
          <p className="text-xs uppercase tracking-wide text-gray-500">masterPOS</p>
        </header>
        <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
          <div className="col-span-12 col-span-5 flex gap-6">
            <CartTable
              items={items}
              selectedId={selectedItemId}
              onSelect={selectItem}
              onDelete={removeItem}
              onMoveUp={moveItemUp}
              onMoveDown={moveItemDown}
              onProductSearch={handleProductSearch}
              onUpdateItem={handleUpdateItem}
              keyboardEnabled={keyboardOpen}
              toggleKeyboard={toggleKeyboard}
            />
          </div>
          <div className="col-span-12 col-span-4 flex flex-col gap-6">
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


          <div className="col-span-12 col-span-3 flex gap-6">
            <div className="w-full max-w-xs">
              <ClientCard value={customer} onChange={setCustomer} />
              <ActionsPanel
                onMoveUp={() => selectedItemId && moveItemUp(selectedItemId)}
                onMoveDown={() => selectedItemId && moveItemDown(selectedItemId)}
                onPriceCheck={openPriceCheck}
                onAddPackaging={handlePackaging}
                onExit={handleExit}
                onAddProduct={handleAddProduct}
                hasSelection={Boolean(selectedItemId)} onDelete={function (): void {
                  throw new Error("Function not implemented.");
                }} onToggleKeyboard={function (): void {
                  throw new Error("Function not implemented.");
                }} />
            </div>
          </div>
        </div>
        <footer className="text-center text-sm text-gray-500 flex-shrink-0">
          <div className="text-sm text-gray-500 text-right">
            <p>{new Date().toLocaleString("ro-RO")}</p>
            {lastAction && <p className="text-indigo-600">{lastAction}</p>}
            {toast && <p className="text-emerald-600">{toast}</p>}
          </div>
        </footer>
      </div>

      {/* Render price check popup first, then Keypad above it if open */}

      {priceCheckOpen && (
        <div
          className={
            `fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 p-4 transition-all duration-300` +
            (keyboardOpen ? ' sm:items-end sm:pb-[340px]' : '')
          }
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <header className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Verifică preț</h2>
              <button className="text-gray-500" onClick={() => setPriceCheckOpen(false)}>
                ✕
              </button>
            </header>
            <div className="flex gap-2">
              <input
                data-request="true"
                value={priceCheckCode}
                onChange={(event) => setPriceCheckCode(event.target.value)}
                className="h-12 flex-1 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/40"
                placeholder="UPC"
                inputMode="decimal"
                data-keyboard="numeric"
              />
              <button
                type="button"
                onClick={toggleKeyboard}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  keyboardOpen 
                    ? 'bg-brand-indigo text-white border-brand-indigo' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                title={keyboardOpen ? "Dezactivează tastatura" : "Activează tastatura"}
              >
                ⌨️
              </button>
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

      {/* Keypad always renders above popups */}
      <Keypad open={keyboardOpen} onClose={closeKeyboard} />
    </main>
  );
}
