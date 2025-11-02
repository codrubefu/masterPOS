import { type MouseEvent, useEffect, useMemo, useState } from "react";
import clsx from "clsx";

type InputTarget = HTMLInputElement | HTMLTextAreaElement;

interface KeypadProps {
  open: boolean;
  onClose: () => void;
}

type KeyboardMode = "numeric" | "text";

function isEditable(element: Element | null): element is InputTarget {
  return (
    !!element &&
    (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) &&
    !element.readOnly &&
    !element.disabled
  );
}

function getActiveEditable(): InputTarget | null {
  const active = typeof document !== "undefined" ? document.activeElement : null;
  if (isEditable(active)) {
    return active;
  }
  return null;
}

function getKeyboardMode(target: InputTarget | null): KeyboardMode {
  if (!target) {
    return "numeric";
  }
  const explicitMode = target.getAttribute("data-keyboard");
  if (explicitMode === "numeric" || explicitMode === "text") {
    return explicitMode;
  }
  if (target instanceof HTMLInputElement) {
    if (target.type === "number" || target.type === "tel") {
      return "numeric";
    }
  }
  if (target.inputMode === "numeric" || target.inputMode === "decimal") {
    return "numeric";
  }
  return "text";
}

function extractLabel(target: InputTarget | null): string {
  if (!target) {
    return "Niciun câmp selectat";
  }
  const ariaLabel = target.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  const labelledBy = target.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelNode = document.getElementById(labelledBy);
    if (labelNode?.textContent) {
      return labelNode.textContent.trim();
    }
  }
  if (target.placeholder) return target.placeholder;
  if (target.name) return target.name;
  if (target.id) {
    const label = document.querySelector(`label[for="${target.id}"]`);
    if (label?.textContent) {
      return label.textContent.trim();
    }
  }
  const wrappingLabel = target.closest("label");
  if (wrappingLabel?.textContent) {
    return wrappingLabel.textContent.trim();
  }
  return "Câmp activ";
}

export function Keypad({ open, onClose }: KeypadProps) {
  const [target, setTarget] = useState<InputTarget | null>(null);

  useEffect(() => {
    if (!open) return;
    setTarget(getActiveEditable());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleFocusIn = () => {
      setTarget(getActiveEditable());
    };
    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: Event) => {
      const keypadElement = document.querySelector('[data-keypad="true"]');
      if (keypadElement && !keypadElement.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleFocusOut = () => {
      // Small delay to allow for focus changes within the keypad
      setTimeout(() => {
        const activeElement = document.activeElement;
        const keypadElement = document.querySelector('[data-keypad="true"]');
        if (!isEditable(activeElement) && keypadElement && !keypadElement.contains(activeElement)) {
          onClose();
        }
      }, 100);
    };
    document.addEventListener("focusout", handleFocusOut);
    return () => document.removeEventListener("focusout", handleFocusOut);
  }, [open, onClose]);

  const label = useMemo(() => extractLabel(target), [target]);
  const mode = useMemo(() => getKeyboardMode(target), [target]);

  const ensureFocus = () => {
    const element = target ?? getActiveEditable();
    if (!element) return null;
    if (document.activeElement !== element) {
      element.focus();
    }
    return element;
  };

  const updateValue = (updater: (value: string, start: number, end: number) => { value: string; caret: number }) => {
    const element = ensureFocus();
    if (!element) return;
    const { selectionStart, selectionEnd, value } = element;
    const start = selectionStart ?? value.length;
    const end = selectionEnd ?? start;
    const next = updater(value, start, end);
    element.value = next.value;
    const caret = Math.max(0, Math.min(next.caret, element.value.length));
    if (typeof element.setSelectionRange === "function") {
      element.setSelectionRange(caret, caret);
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const handleInsert = (text: string) => {
    updateValue((value, start, end) => {
      const sanitized = mode === "numeric" && text === "," ? "." : text;
      const nextValue = value.slice(0, start) + sanitized + value.slice(end);
      return { value: nextValue, caret: start + sanitized.length };
    });
  };

  const handleBackspace = () => {
    updateValue((value, start, end) => {
      if (start !== end) {
        const nextValue = value.slice(0, start) + value.slice(end);
        return { value: nextValue, caret: start };
      }
      if (start === 0) {
        return { value, caret: 0 };
      }
      const nextValue = value.slice(0, start - 1) + value.slice(end);
      return { value: nextValue, caret: start - 1 };
    });
  };

  const handleClear = () => {
    updateValue(() => ({ value: "", caret: 0 }));
  };

  const handleToggleSign = () => {
    updateValue((value) => {
      if (!value) {
        return { value: "-", caret: 1 };
      }
      if (value.startsWith("-")) {
        const nextValue = value.slice(1);
        return { value: nextValue, caret: nextValue.length };
      }
      const nextValue = `-${value}`;
      return { value: nextValue, caret: nextValue.length };
    });
  };

  const handleEnter = () => {
    const element = ensureFocus();
    if (!element) return;
    const form = element.form;
    if (form) {
      if (typeof form.requestSubmit === "function") {
        form.requestSubmit();
      } else {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      }
    }
    onClose();
  };

  if (!open) {
    return null;
  }

  const heading = mode === "numeric" ? "Tastatură numerică" : "Tastatură QWERTY";
  const buttonClass =
    "rounded-2xl bg-slate-900 text-white font-semibold shadow-md hover:bg-slate-800 active:bg-slate-900 transition";
  const controlClass =
    "rounded-2xl bg-white border border-gray-200 text-sm font-semibold text-slate-700 shadow-sm hover:border-brand-indigo hover:text-brand-indigo transition";

  const handlePointerDown = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    ensureFocus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 sm:items-center sm:justify-end sm:p-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" data-keypad="true">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-500">Tastatură pe ecran</p>
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <p className="text-xs text-gray-400 mt-1">{heading}</p>
          </div>
          <button
            type="button"
            onMouseDown={handlePointerDown}
            onClick={onClose}
            className="text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            Închide
          </button>
        </header>
        {mode === "numeric" ? (
          <div className="mt-6 grid grid-cols-4 gap-3">
            {["7", "8", "9"].map((digit) => (
              <button
                key={digit}
                type="button"
                className={clsx(buttonClass, "h-16 text-2xl")}
                onMouseDown={handlePointerDown}
                onClick={() => handleInsert(digit)}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              className={clsx(controlClass, "h-16 text-lg")}
              onMouseDown={handlePointerDown}
              onClick={handleBackspace}
            >
              ⌫
            </button>
            {["4", "5", "6"].map((digit) => (
              <button
                key={digit}
                type="button"
                className={clsx(buttonClass, "h-16 text-2xl")}
                onMouseDown={handlePointerDown}
                onClick={() => handleInsert(digit)}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              className={clsx(controlClass, "h-16 text-base")}
              onMouseDown={handlePointerDown}
              onClick={handleClear}
            >
              Șterge
            </button>
            {["1", "2", "3"].map((digit) => (
              <button
                key={digit}
                type="button"
                className={clsx(buttonClass, "h-16 text-2xl")}
                onMouseDown={handlePointerDown}
                onClick={() => handleInsert(digit)}
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              className={clsx(controlClass, "h-16 text-base")}
              onMouseDown={handlePointerDown}
              onClick={handleToggleSign}
            >
              ±
            </button>
            <button
              type="button"
              className={clsx(buttonClass, "h-16 text-2xl")}
              onMouseDown={handlePointerDown}
              onClick={() => handleInsert("0")}
            >
              0
            </button>
            <button
              type="button"
              className={clsx(buttonClass, "h-16 text-2xl")}
              onMouseDown={handlePointerDown}
              onClick={() => handleInsert("00")}
            >
              00
            </button>
            <button
              type="button"
              className={clsx(buttonClass, "h-16 text-2xl")}
              onMouseDown={handlePointerDown}
              onClick={() => handleInsert(",")}
            >
              ,
            </button>
            <button
              type="button"
              className="h-16 rounded-2xl bg-indigo-600 text-white text-lg font-semibold shadow-md hover:bg-indigo-500 transition"
              onMouseDown={handlePointerDown}
              onClick={handleEnter}
            >
              Enter
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {[
              ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"],
              ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
              ["A", "S", "D", "F", "G", "H", "J", "K", "L", ";"],
              ["Z", "X", "C", "V", "B", "N", "M", ",", ".", "/"]
            ].map((row, index) => (
              <div key={index} className="grid grid-cols-10 gap-2">
                {row.map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={clsx(buttonClass, "h-12 text-lg")}
                    onMouseDown={handlePointerDown}
                    onClick={() => handleInsert(key)}
                  >
                    {key}
                  </button>
                ))}
              </div>
            ))}
            <div className="grid grid-cols-5 gap-2">
              <button
                type="button"
                className={clsx(buttonClass, "col-span-3 h-12 text-lg")}
                onMouseDown={handlePointerDown}
                onClick={() => handleInsert(" ")}
              >
                Spațiu
              </button>
              <button
                type="button"
                className={clsx(controlClass, "h-12 text-base")}
                onMouseDown={handlePointerDown}
                onClick={handleBackspace}
              >
                ⌫
              </button>
              <button
                type="button"
                className={clsx(controlClass, "h-12 text-base")}
                onMouseDown={handlePointerDown}
                onClick={handleClear}
              >
                Șterge
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className={clsx(controlClass, "h-12 text-base")}
                onMouseDown={handlePointerDown}
                onClick={() => handleInsert("-")}
              >
                -
              </button>
              <button
                type="button"
                className="h-12 rounded-2xl bg-indigo-600 text-white text-base font-semibold shadow-md hover:bg-indigo-500 transition"
                onMouseDown={handlePointerDown}
                onClick={handleEnter}
              >
                Enter
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
