import { useHotkeys } from "react-hotkeys-hook";
import { POS_SHORTCUTS } from "../../lib/shortcuts";
import { useCartStore } from "../../app/store";
import { getConfig } from "../../app/configLoader";
import { useState, useEffect, useRef } from "react";

interface PaymentButtonsProps {
  onPayCash: () => void;
  onPayCard: () => void;
  onPayMixed: () => void;
  onPayModern: () => void;
  onExit: () => void;
  enabled?: boolean;
  setEnabled?: (enabled: boolean) => void;
}

export function PaymentButtons({ onPayCash, onPayCard, onPayMixed, onPayModern, onExit, enabled = false, setEnabled }: PaymentButtonsProps) {
  const { total, items, casa, customer, cashGiven, subtotal, totalDiscount, change, resetCart, cardAmount, numerarAmount, setPendingPayment } = useCartStore((state) => ({
    total: state.total,
    items: state.items,
    casa: state.casa,
    customer: state.customer,
    cashGiven: state.cashGiven,
    subtotal: state.subtotal,
    totalDiscount: state.totalDiscount,
    change: state.change,
    resetCart: state.resetCart,
    cardAmount: state.cardAmount,
    numerarAmount: state.numerarAmount,
    setPendingPayment: state.setPendingPayment,
  }));

  const [isLoadingSubtotal, setIsLoadingSubtotal] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [pollingTimeoutId, setPollingTimeoutId] = useState<NodeJS.Timeout | null>(null);
  
  // Use refs to hold the actual timer IDs for immediate cleanup
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if mixed payment is active (both card and numerar have values > 1)
  const isMixedPaymentActive = cardAmount > 1 && numerarAmount > 1;
  // Single payment methods are disabled when mixed payment is active
  const isSinglePaymentDisabled = isMixedPaymentActive;

  useHotkeys(POS_SHORTCUTS.payCash, (event) => {
    if (!enabled || isLoadingPayment || isSinglePaymentDisabled) return;
    event.preventDefault();
    handlePayment('cash', onPayCash);
  });
  useHotkeys(POS_SHORTCUTS.payCard, (event) => {
    if (!enabled || isLoadingPayment || isSinglePaymentDisabled) return;
    event.preventDefault();
    handlePayment('card', onPayCard);
  });
  useHotkeys(POS_SHORTCUTS.payMixed, (event) => {
    if (!enabled || isLoadingPayment || !isMixedPaymentActive) return;
    event.preventDefault();
    handlePayment('mixed', onPayMixed);
  });
  useHotkeys(POS_SHORTCUTS.exit, (event) => {
    event.preventDefault();
    onExit();
  });

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const buttonClass = "h-14 rounded-2xl text-white font-semibold text-base shadow-sm transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-400";

  const handleSubTotal = async () => {
    if (setEnabled) setEnabled(true);
    
    setIsLoadingSubtotal(true);
    try {
      const config = await getConfig();
      const baseUrl = config.middleware?.apiBaseUrl || '';
      
      // Prepare the subtotal payload with all store data
      const subtotalPayload = {
        items,
        casa,
        customer,
        cashGiven,
        subtotal,
        totalDiscount,
        total,
        change
      };
      
      const response = await fetch(`${baseUrl}/api/payments/subtotal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subtotalPayload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Subtotal success:', data);
      } else {
        console.error('Subtotal error:', data.message || 'Eroare la trimiterea subtotalului');
      }
    } catch (error) {
      console.error('Subtotal network error:', error);
    } finally {
      setIsLoadingSubtotal(false);
    }
  };

  const handlePayment = async (type: 'cash' | 'card' | 'mixed' | 'modern', originalHandler: () => void) => {
    setIsLoadingPayment(true);
    try {
      const config = await getConfig();
      const baseUrl = config.middleware?.apiBaseUrl || '';
      
      // Prepare the payment payload with all store data and type
      const paymentPayload = {
        type,
        items,
        casa,
        customer,
        cashGiven,
        subtotal,
        totalDiscount,
        total,
        change
      };
      
      const response = await fetch(`${baseUrl}/api/payments/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentPayload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log('Payment success:', data);
        
        // Save payment data to store (don't delete storage yet)
        if (data.data) {
          setPendingPayment({
            bon_no: data.data.bon_no,
            processed_at: data.data.processed_at
          });
        }
        
        // Show popup and start polling
        setShowPaymentPopup(true);
        startPolling(baseUrl, originalHandler);
      } else {
        console.error('Payment error:', data.message || 'Eroare la procesarea plății');
      }
    } catch (error) {
      console.error('Payment network error:', error);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const startPolling = (baseUrl: string, originalHandler: () => void) => {
    // Clean up any existing timers first
    stopPolling();
    
    let isPollingActive = true;
    
    // Set timeout for 10 seconds
    const timeoutId = setTimeout(() => {
      isPollingActive = false;
      setPaymentError('Timpul de așteptare a expirat. Vă rugăm verificați starea plății.');
      stopPolling();
    }, 10000);
    
    pollingTimeoutRef.current = timeoutId;
    setPollingTimeoutId(timeoutId);
    
    const intervalId = setInterval(async () => {
      // Stop making requests if polling is no longer active
      if (!isPollingActive) {
        return;
      }
      
      try {
        // Get the pending payment from store
        const pendingPayment = useCartStore.getState().pendingPayment;
        
        if (!pendingPayment) {
          console.error('No pending payment found');
          isPollingActive = false;
          stopPolling();
          return;
        }
        
        const response = await fetch(`${baseUrl}/api/payments/is-payment-done`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            bon_no: pendingPayment.bon_no
          })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          // Payment is done, clean up everything immediately
          isPollingActive = false;
          stopPolling();
          
          // Reset all state variables
          setShowPaymentPopup(false);
          setPaymentError(null);
          setIsLoadingPayment(false);
          setIsLoadingSubtotal(false);
          
          // Reset cart and pending payment
          resetCart();
          setPendingPayment(undefined);
          
          // Reset the enabled state
          if (setEnabled) {
            setEnabled(false);
          }
          
          // Call the original handler
          originalHandler();
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 500); // Poll every 0.5 seconds
    
    pollingIntervalRef.current = intervalId;
    setPollingIntervalId(intervalId);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setPollingIntervalId(null);
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
      setPollingTimeoutId(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <button 
          type="button" 
          className={`${buttonClass} bg-amber-500 hover:bg-amber-400`} 
          onClick={() => handlePayment('mixed', onPayMixed)} 
          disabled={!enabled || isLoadingPayment || !isMixedPaymentActive}
        >
          {isLoadingPayment ? 'Se procesează...' : 'Plata mixtă'}
        </button>
        <button 
          type="button" 
          className={`${buttonClass} bg-emerald-600 hover:bg-emerald-500`} 
          onClick={() => handlePayment('cash', onPayCash)} 
          disabled={!enabled || isLoadingPayment || isSinglePaymentDisabled}
        >
          {isLoadingPayment ? 'Se procesează...' : 'Plata numerar'}
        </button>
        <button 
          type="button" 
          className={`${buttonClass} bg-indigo-600 hover:bg-indigo-500`} 
          onClick={() => handlePayment('card', onPayCard)} 
          disabled={!enabled || isLoadingPayment || isSinglePaymentDisabled}
        >
          {isLoadingPayment ? 'Se procesează...' : 'Plata card'}
        </button>
        <button 
          type="button" 
          className={`${buttonClass} bg-gray-700 hover:bg-gray-600 col-span-2 lg:col-span-4`} 
          onClick={handleSubTotal}
          disabled={enabled || isLoadingSubtotal}
        >
          {isLoadingSubtotal ? 'Se procesează...' : `Sub Total (Total: ${total})`}
        </button>
      </div>

      {/* Payment Processing Popup */}
      {showPaymentPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              {!paymentError ? (
                <>
                  {/* Loader Spinner */}
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-brand-indigo"></div>
                  
                  <h2 className="text-xl font-semibold text-slate-900">
                    Se procesează plata...
                  </h2>
                  
                  <p className="text-sm text-slate-600 text-center">
                    Vă rugăm așteptați confirmarea plății
                  </p>
                </>
              ) : (
                <>
                  {/* Error Icon */}
                  <div className="flex items-center justify-center h-16 w-16 rounded-full bg-red-100">
                    <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  
                  <h2 className="text-xl font-semibold text-slate-900">
                    Eroare
                  </h2>
                  
                  <p className="text-sm text-slate-600 text-center">
                    {paymentError}
                  </p>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentPopup(false);
                      setPaymentError(null);
                    }}
                    className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
                  >
                    Închide
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
