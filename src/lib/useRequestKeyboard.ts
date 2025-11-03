import { useEffect, useState } from 'react';

export function useRequestKeyboard() {
  const [keyboardEnabled, setKeyboardEnabled] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFocusIn = (event: Event) => {
      const target = event.target as HTMLElement;
      
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
        const isRequestInput = target.getAttribute('data-request') === 'true';
        
        if (isRequestInput) {
          // Set a custom attribute to indicate if on-screen keyboard should be shown
          target.setAttribute('data-show-onscreen-keyboard', keyboardEnabled.toString());
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn, true);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn, true);
    };
  }, [keyboardEnabled]);

  const toggleKeyboard = () => {
    setKeyboardEnabled(prev => {
      const nextEnabled = !prev;
      
      // If enabling keyboard, focus the first request input found
      if (nextEnabled && typeof document !== 'undefined') {
        // Small delay to ensure the state is updated first
        setTimeout(() => {
          const requestInputs = document.querySelectorAll('input[data-request="true"], textarea[data-request="true"]');
          const firstRequestInput = requestInputs[0] as HTMLInputElement | HTMLTextAreaElement;
          
          if (firstRequestInput && !firstRequestInput.disabled && !firstRequestInput.readOnly) {
            firstRequestInput.focus();
          }
        }, 10);
      }
      
      return nextEnabled;
    });
  };

  return {
    keyboardEnabled,
    toggleKeyboard,
    setKeyboardEnabled
  };
}