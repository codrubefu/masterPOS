import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { CUSTOMERS, DEFAULT_CUSTOMER } from "../mocks/customers";
import { findProductByUpc } from "../mocks/products";
import { roundMoney } from "../lib/money";
import {
  AddProductInput,
  computeCartState,
  createCartItem,
  mergeItems,
  moveItem,
  removeCartItem,
  resetCart,
  updateCartItem
} from "../features/cart/utils";
import type {
  CartItem,
  CartState,
  Customer,
  PaymentMethod,
  Product
} from "../features/cart/types";

export interface Receipt {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: string;
}

interface CartStore extends CartState {
  customer?: Customer;
  receipts: Receipt[];
  customerOptions: Customer[];
  addProductByUpc: (upc: string, input?: Partial<AddProductInput>) => { success: boolean; itemId?: string };
  addCustomItem: (input: AddProductInput) => { itemId: string };
  selectItem: (id?: string) => void;
  updateItem: (id: string, updater: (item: CartItem) => CartItem) => void;
  removeItem: (id: string) => void;
  moveItemUp: (id: string) => void;
  moveItemDown: (id: string) => void;
  toggleStorno: (id: string) => void;
  setCashGiven: (value: number) => void;
  setCustomer: (customer: Customer) => void;
  setPaymentMethod: (method?: PaymentMethod) => void;
  completePayment: (method: PaymentMethod) => Receipt | undefined;
  resetCart: () => void;
}

const initialState: CartState = {
  ...resetCart(),
  customer: DEFAULT_CUSTOMER,
  selectedItemId: undefined,
  lastAction: undefined,
  paymentMethod: undefined
};

function recalcState(items: CartItem[], cashGiven: number) {
  const { subtotal, totalDiscount, total, change } = computeCartState(items, cashGiven);
  return { items, cashGiven, subtotal, totalDiscount, total, change };
}

function createId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);
}

const memoryStorage: Storage = {
  get length() {
    return 0;
  },
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => undefined
};

const storage = createJSONStorage<CartStore>(() =>
  typeof window !== "undefined" && window.localStorage ? window.localStorage : memoryStorage
);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      receipts: [],
      customerOptions: CUSTOMERS,
      addProductByUpc: (upc, input) => {
        const product = findProductByUpc(upc);
        if (!product) {
          return { success: false };
        }
        const qty = input?.qty ?? 1;
        const overrides = {
          unitPrice: input?.unitPrice ?? product.price,
          percentDiscount: input?.percentDiscount,
          valueDiscount: input?.valueDiscount,
          storno: input?.storno
        } satisfies Partial<CartItem>;
        set((state) => {
          const items = mergeItems(state.items, product, qty, overrides);
          const next = recalcState(items, state.cashGiven);
          const itemId = findLastIdByProduct(items, product);
          return {
            ...state,
            ...next,
            selectedItemId: itemId,
            lastAction: `Adăugat ${product.name}`
          };
        });
        return { success: true, itemId: findLastIdByProduct(get().items, product) };
      },
      addCustomItem: (input) => {
        const item = createCartItem(input);
        set((state) => {
          const items = [...state.items, item];
          const next = recalcState(items, state.cashGiven);
          return {
            ...state,
            ...next,
            selectedItemId: item.id,
            lastAction: `Adăugat ${item.product.name}`
          };
        });
        return { itemId: item.id };
      },
      selectItem: (id) =>
        set((state) => ({
          ...state,
          selectedItemId: id,
          lastAction: id ? `Selectat produs` : state.lastAction
        })),
      updateItem: (id, updater) =>
        set((state) => {
          const items = updateCartItem(state.items, id, updater);
          const next = recalcState(items, state.cashGiven);
          return {
            ...state,
            ...next,
            lastAction: `Actualizat linia`
          };
        }),
      removeItem: (id) =>
        set((state) => {
          const items = removeCartItem(state.items, id);
          const next = recalcState(items, state.cashGiven);
          return {
            ...state,
            ...next,
            selectedItemId: next.items.at(-1)?.id,
            lastAction: `Produs șters`
          };
        }),
      moveItemUp: (id) =>
        set((state) => ({
          ...state,
          items: moveItem(state.items, id, "up"),
          lastAction: "Mutat produs"
        })),
      moveItemDown: (id) =>
        set((state) => ({
          ...state,
          items: moveItem(state.items, id, "down"),
          lastAction: "Mutat produs"
        })),
      toggleStorno: (id) =>
        set((state) => {
          const items = updateCartItem(state.items, id, (item) => ({
            ...item,
            storno: !item.storno
          }));
          const next = recalcState(items, state.cashGiven);
          return {
            ...state,
            ...next,
            lastAction: "Storno produs"
          };
        }),
      setCashGiven: (value) =>
        set((state) => {
          const cashGiven = roundMoney(Math.max(value, 0));
          const next = computeCartState(state.items, cashGiven);
          return {
            ...state,
            ...next,
            cashGiven,
            lastAction: "Actualizat plată numerar"
          };
        }),
      setCustomer: (customer) =>
        set((state) => ({
          ...state,
          customer,
          lastAction: `Client ${customer.lastName ?? customer.id}`
        })),
      setPaymentMethod: (method) =>
        set((state) => ({
          ...state,
          paymentMethod: method,
          lastAction: method ? `Metodă ${method}` : state.lastAction
        })),
      completePayment: (method) => {
        const state = get();
        if (state.items.length === 0) return undefined;
        const receipt: Receipt = {
          id: createId(),
          items: state.items,
          total: state.total,
          paymentMethod: method,
          timestamp: new Date().toISOString()
        };
        set({
          ...initialState,
          receipts: [...state.receipts, receipt],
          customerOptions: state.customerOptions,
          lastAction: `Plată ${method} înregistrată`,
          paymentMethod: method
        });
        return receipt;
      },
      resetCart: () =>
        set((state) => ({
          ...state,
          ...initialState
        }))
    }),
    {
      name: "pos-cart-state",
      storage,
      partialize: (state) => ({
        items: state.items,
        cashGiven: state.cashGiven,
        subtotal: state.subtotal,
        totalDiscount: state.totalDiscount,
        total: state.total,
        change: state.change,
        customer: state.customer,
        selectedItemId: state.selectedItemId,
        receipts: state.receipts,
        paymentMethod: state.paymentMethod
      })
    }
  )
);

function findLastIdByProduct(items: CartItem[], product: Product) {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item.product.id === product.id) return item.id;
  }
  return undefined;
}
