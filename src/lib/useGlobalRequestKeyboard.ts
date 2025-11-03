import { useEffect } from 'react';

/**
 * Global hook to handle data-request keyboard logic for all components.
 * Controls when to open/close the on-screen keyboard based on input focus.
 * @param setKeyboardOpen Callback to set the keyboard open/close state
 */
export function useGlobalRequestKeyboard(setKeyboardOpen: (open: boolean) => void) {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleFocusIn = (event: Event) => {
      const target = event.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement
      ) {
        if (target.readOnly || target.disabled || target.type === 'hidden') {
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
    document.addEventListener('focusin', handleFocusIn);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
    };
  }, [setKeyboardOpen]);
}
