import { Fragment, useEffect, useMemo, useState, useRef } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { nanoid } from "nanoid/non-secure";
import { useCartStore } from "../app/store";
import {fetchProductInfoByUpc} from "../app/checkPrice";
import { ClientCard } from "../components/pos/ClientCard";
import { CartTable } from "../components/pos/CartTable";
import { ActionsPanel } from "../components/pos/ActionsPanel";
import { TotalsPanel } from "../components/pos/TotalsPanel";
import { PaymentButtons } from "../components/pos/PaymentButtons";
import { Keypad } from "../components/pos/Keypad";
import { SettingsModal } from "../components/pos/SettingsModal";
import { formatMoney } from "../lib/money";
import { CartItem, PaymentMethod, Product, Customer } from "../features/cart/types";
import { useGlobalRequestKeyboard } from "../lib/useGlobalRequestKeyboard";
import { random } from "nanoid";
import { a } from "vitest/dist/suite-dWqIFb_-.js";

export function PosPage() {
  // Ref for price check input
  const priceCheckInputRef = useRef<HTMLInputElement | null>(null);
  
  // Settings modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  
  // Cancel receipt confirmation state
  const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
  
  // Client error popup state
  const [showClientErrorPopup, setShowClientErrorPopup] = useState(false);
  const [clientErrorMessage, setClientErrorMessage] = useState("");
  
  const {
    items,
    selectedItemId,
    subtotal,
    total,
    change,
    cashGiven,
    customer,
    lastAction,
    casa,
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
    updateItem,
    resetCart
  } = useCartStore((state) => ({
    items: state.items,
    selectedItemId: state.selectedItemId,
    subtotal: state.subtotal,
    total: state.total,
    change: state.change,
    cashGiven: state.cashGiven,
    customer: state.customer,
    lastAction: state.lastAction,
    casa: state.casa,
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
    updateItem: state.updateItem,
    resetCart: state.resetCart
  }));

  const [priceCheckOpen, setPriceCheckOpen] = useState(false);
  const [priceCheckCode, setPriceCheckCode] = useState("");
  const [priceCheckResult, setPriceCheckResult] = useState<CartItem | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [cartInfo, setCartInfo] = useState<any>(null);
  const [cartError, setCartError] = useState<any>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [isPriceKeyboardEnabled, setIsPriceKeyboardEnabled] = useState(false);

  // Initialize global request keyboard functionality
  useGlobalRequestKeyboard(setKeyboardOpen);

  // Sync priceCheckCode state with native input events (for onscreen keyboard)
  useEffect(() => {
    const input = priceCheckInputRef.current;
    if (!input) return;
    const handleNativeInput = (e: Event) => {
      if (e.target instanceof HTMLInputElement) {
        setPriceCheckCode(e.target.value);
      }
    };
    input.addEventListener('input', handleNativeInput);
    return () => {
      input.removeEventListener('input', handleNativeInput);
    };
  }, [priceCheckOpen]); // Re-run when modal opens/closes

  const handleStorno = () => {
    if (!selectedItemId) return;
    toggleStorno(selectedItemId);
    setToast("Linia selectată a fost stornată");
  };

  const handlePackaging = () => {
    const product: Product = {
      id: 'ambalaj',
      upc: `AMB-ambalaj`,
      name: "Bon ambalaje",
      price: 0.5,
      clasa: "ZZ-AMBALAJE",
      grupa: "ZZ-AMBALAJE"
    };
    addCustomItem({ product, qty: 1, unitPrice: 0.5 });
    setToast("Ambalaj adăugat pe bon");
  };

  const handlePayment = (method: PaymentMethod) => {
    // Print all data from the store
    const imtems = useCartStore.getState().items;
    console.log('STORE DATA:', items);
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

  const runPriceCheck = async () => {
    const code = priceCheckCode.trim();
    if (!code) {
      setPriceCheckResult(null);
      setToast("Introduceți un cod valid");
      return;
    }
    try {
      setToast("Căutare produs...");
      const info = await fetchProductInfoByUpc(code);
      if (info) {
        setPriceCheckResult(info);
        setToast(`Produs găsit: ${info.product.name}`);
      } else {
        setPriceCheckResult(null);
        setToast("Niciun produs găsit");
      }
    } catch (error) {
      setPriceCheckResult(null);
      setToast("Eroare la căutarea produsului");
      console.error('Price check error:', error);
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

  // State to control PaymentButtons enabled
  const [paymentButtonsEnabled, setPaymentButtonsEnabled] = useState(false);

  const handleProductAdd = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCartInfo("Introduceți un termen de căutare");
      setCartError(true);
      return;
    }

    try {
      setCartInfo("Căutare produs...");
      setCartError(false);
      console.log('Searching for product with UPC:', searchTerm);
      console.log('Current cart items:', items);
      // Check if product already exists in cart (trim spaces for comparison)
      const existingItem = items.find(item => 
        item.product.upc.trim() === searchTerm.trim() && !item.storno
      );
      console.log('Existing item in cart:', existingItem);
      if (existingItem) {
        // Product exists, use updateItem to increment quantity
        await updateItem(existingItem.id, (item) => ({
          ...item,
          qty: item.qty + 1
        }));
        setPaymentButtonsEnabled(false);
        setCartInfo(`Cantitate actualizată: ${existingItem.product.name}`);
        setCartError(false);
      } else {
        // Product doesn't exist, add new
        const result = await addProductByUpc(searchTerm);
        setPaymentButtonsEnabled(false); // Disable payment buttons after product add
        if (result.success) {
          console.log('Added product result:', result);
          setCartInfo(`Produs găsit și adăugat: ${result.data ? result.data.name : searchTerm}`);
          setCartError(false);
        } else {
          setCartInfo(result.error || "Produsul nu a putut fi adăugat");
          setCartError(true);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setCartInfo("Eroare la căutarea produsului");
      setCartError(true);
    }
  };

  const handleClientUpdate = async (updatedCustomer: Customer) => {
    if (!updatedCustomer) {
      setCartInfo("Date client invalide");
      setCartError(true);
      return;
    }
    setCartInfo("Actualizare client...");
    setCartError(false);
    const result = await setCustomer(updatedCustomer);
    if (result.success) {
      setCartInfo("Client actualizat cu succes");
      setCartError(false);
    } else {
      // Show custom popup with error message
      setClientErrorMessage(result.error || "Clientul nu există");
      setShowClientErrorPopup(true);
      
      // Reset to default customer
      const defaultCustomer: Customer = {
        id: "",
        type: "pf"
      };
      await setCustomer(defaultCustomer);
      
      setCartInfo("Client setat pe default");
      setCartError(false);
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

        // Do not open onscreen keyboard for checkbox inputs
        if (target instanceof HTMLInputElement && target.type === 'checkbox') {
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
  const handleUpdateItem = async (id: string, updates: Partial<CartItem>) => {
    const result = await updateItem(id, (item) => ({ ...item, ...updates }));
    if (!result.success) {
      setCartInfo(result.error || "Eroare la actualizarea produsului");
      setCartError(true);
    }
  };

  // Wrapper function to handle delete with error handling
  const handleDeleteItem = async (id: string) => {
    const result = await removeItem(id);
    if (!result.success) {
      setCartInfo(result.error || "Eroare la ștergerea produsului");
      setCartError(true);
    }
  };

  return (
    <main className="h-screen bg-slate-100 p-6 lg:p-2 overflow-hidden">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-6 h-full">
        <header className="flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Optimizer ThePOS</p>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Casa:</span>
              <span className="font-semibold text-blue-600">{casa}</span>
            </div>
            <div className={`flex items-center gap-4 text-sm ${cartError ? 'text-red-600' : 'text-green-600'}`}>{cartInfo}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCancelConfirmation(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Anulează bon
            </button>
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Setări
            </button>
          </div>
        </header>
        <div className="grid grid-cols-12 gap-6 flex-1 overflow-hidden">
          <div className="col-span-12 col-span-5 flex gap-6">
            <CartTable
              items={items}
              selectedId={selectedItemId}
              onSelect={selectItem}
              onDelete={handleDeleteItem}
              onMoveUp={moveItemUp}
              onMoveDown={moveItemDown}
              handleProductAdd={handleProductAdd}
              onUpdateItem={handleUpdateItem}
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
              enabled={paymentButtonsEnabled}
              setEnabled={setPaymentButtonsEnabled}
            />
          </div>


          <div className="col-span-12 col-span-3 flex gap-6">
            <div className="w-full max-w-xs">
              <ClientCard value={customer} onChange={handleClientUpdate} />
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
            `fixed inset-0 z-40 flex justify-center items-start pt-12 bg-slate-900/50 p-4 transition-all duration-300` +
            (keyboardOpen ? ' sm:pb-[340px]' : '')
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
                ref={priceCheckInputRef}
                value={priceCheckCode}
                onChange={(e) => setPriceCheckCode(e.target.value)}
                className="h-12 flex-1 rounded-xl border border-gray-200 px-3 text-sm shadow-sm focus:border-brand-indigo focus:ring-2 focus:ring-brand-indigo/40"
                placeholder="UPC"
                inputMode="numeric"
                data-keyboard="numeric"
                data-request={isPriceKeyboardEnabled ? "false" : "true"}
              />
              <label htmlFor="togglePriceKeyboard" className="flex items-center gap-2 cursor-pointer select-none">
                <span
                  className={
                    isPriceKeyboardEnabled
                      ? "inline-flex items-center justify-center w-8 h-8 rounded bg-brand-indigo/10 border border-brand-indigo text-brand-indigo shadow"
                      : "inline-flex items-center justify-center w-8 h-8 rounded bg-gray-100 border border-gray-300 text-gray-400"
                  }
                  style={{ transition: 'all 0.2s' }}
                >
                  {/* Keyboard SVG icon */}
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="5" width="16" height="10" rx="2" fill="currentColor" fillOpacity="0.15" stroke="currentColor" strokeWidth="1.5" />
                    <rect x="4.5" y="8" width="2" height="2" rx="0.5" fill="currentColor" />
                    <rect x="7.5" y="8" width="2" height="2" rx="0.5" fill="currentColor" />
                    <rect x="10.5" y="8" width="2" height="2" rx="0.5" fill="currentColor" />
                    <rect x="13.5" y="8" width="2" height="2" rx="0.5" fill="currentColor" />
                    <rect x="6" y="11" width="8" height="2" rx="0.5" fill="currentColor" />
                  </svg>
                </span>
                <input
                  type="checkbox"
                  id="togglePriceKeyboard"
                  checked={isPriceKeyboardEnabled}
                  data-request="true"
                  onChange={() => setIsPriceKeyboardEnabled((prev) => !prev)}
                  className="sr-only" // hide the native checkbox
                />
              </label>
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
      
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />

      {/* Cancel Receipt Confirmation Modal */}
      {showCancelConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Anulează bonul?
                </h2>
              </div>
              
              <p className="text-sm text-slate-600">
                Sigur doriți să anulați bonul curent? Toate datele vor fi șterse.
              </p>
              
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowCancelConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-lg transition-colors"
                >
                  Nu, renunță
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetCart();
                    setShowCancelConfirmation(false);
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
                >
                  Da, anulează
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Error Popup */}
      {showClientErrorPopup && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              {/* Error Icon */}
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {/* Error Message */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Client inexistent</h3>
                <p className="text-sm text-gray-600">{clientErrorMessage}</p>
                <p className="text-sm text-gray-600 mt-2">Clientul a fost setat pe default.</p>
              </div>
              
              {/* OK Button */}
              <button
                type="button"
                onClick={() => setShowClientErrorPopup(false)}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors shadow-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
