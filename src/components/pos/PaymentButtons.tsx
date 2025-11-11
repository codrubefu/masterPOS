import { useHotkeys } from "react-hotkeys-hook";
import { POS_SHORTCUTS } from "../../lib/shortcuts";
import { useCartStore } from "../../app/store";
import { getConfig } from "../../app/configLoader";
import { useState } from "react";

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
  const { total, items, casa, customer, cashGiven, subtotal, totalDiscount, change, resetCart, cardAmount, numerarAmount } = useCartStore((state) => ({
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
  }));

  const [isLoadingSubtotal, setIsLoadingSubtotal] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

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
        // Reset the entire store (clear cart, customer, payments, etc.)
        resetCart();
        // Reset the enabled state
        if (setEnabled) {
          setEnabled(false);
        }
        // Call the original handler to complete the payment locally
        originalHandler();
      } else {
        console.error('Payment error:', data.message || 'Eroare la procesarea plății');
      }
    } catch (error) {
      console.error('Payment network error:', error);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  return (
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
        disabled={isLoadingSubtotal}
      >
        {isLoadingSubtotal ? 'Se procesează...' : `Sub Total (Total: ${total})`}
      </button>
    </div>
  );
}
