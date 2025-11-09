import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { roundMoney } from "../lib/money";
import { getConfig } from './configLoader';

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

interface PersistedCartState extends CartState {
  receipts: Receipt[];
}

interface CartStore extends CartState {
  receipts: Receipt[];
  customerOptions: Customer[];
  casa: number; // Casa (register) number: 1, 2, 3, or 4
  addProductByUpc: (upc: string, input?: Partial<AddProductInput>) => Promise<{ success: boolean; itemId?: string }>;
  addCustomItem: (input: AddProductInput) => { itemId: string };
  selectItem: (id?: string) => void;
  updateItem: (id: string, updater: (item: CartItem) => CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  moveItemUp: (id: string) => void;
  moveItemDown: (id: string) => void;
  toggleStorno: (id: string) => void;
  setCashGiven: (value: number) => void;
  setCustomer: (customer: Customer) => void;
  setPaymentMethod: (method?: PaymentMethod) => void;
  setCasa: (casa: number) => void;
  completePayment: (method: PaymentMethod) => Receipt | undefined;
  resetCart: () => void;
}

const DEFAULT_CUSTOMER: Customer = {
  id: "",
  type: "pf"
};

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

const storage = createJSONStorage(() =>
  typeof window !== "undefined" && window.localStorage ? window.localStorage : memoryStorage
);

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      receipts: [],
      customerOptions: [],
      casa: 1, // Default casa is 1
      addProductByUpc: async (upc, input) => {
        // Fetch product from API
        try {
          const config = await getConfig();
                 const baseUrl = config.middleware?.apiBaseUrl || '';
          const response = await fetch(`${baseUrl}/api/articles/${encodeURIComponent(upc)}`);
          if (!response.ok) return { success: false };
          const apiResponse = await response.json();
          if (!apiResponse.success || !apiResponse.data) return { success: false };
          const product = {
            id: String(apiResponse.data.id),
            name: apiResponse.data.name,
            upc: apiResponse.data.upc,
            price: apiResponse.data.price,
            sgr: apiResponse.data.sgr,
          };
          const qty = input?.qty ?? 1;
          const overrides = {
            unitPrice: input?.unitPrice ?? product.price,
            percentDiscount: input?.percentDiscount,
            valueDiscount: input?.valueDiscount,
            storno: input?.storno
          } satisfies Partial<CartItem>;
          set((state) => {
            // Remove existing SGR tax items temporarily
            let items = state.items.filter(item => item.product.id !== 'sgr-tax');
            
            // Add the new product
            items = mergeItems(items, product, qty, overrides);
            
            // If product has SGR, calculate total SGR quantity needed
            if (product.sgr) {
              // Calculate total SGR quantity from all SGR products
              let totalSgrQty = 0;
              for (const item of items) {
                if (item.product.sgr && !item.storno) {
                  totalSgrQty += item.qty;
                }
              }
              
              // Add SGR tax item at the end
              if (totalSgrQty > 0) {
                const sgrProduct: Product = {
                  id: 'sgr-tax',
                  upc: 'SGR-TAX',
                  name: 'Taxa SGR',
                  price: 0.5
                };
                const sgrItem = createCartItem({ 
                  product: sgrProduct, 
                  qty: totalSgrQty, 
                  unitPrice: 0.5 
                });
                items = [...items, sgrItem];
              }
            } else {
              // Re-add SGR tax if there are SGR products
              let totalSgrQty = 0;
              for (const item of items) {
                if (item.product.sgr && !item.storno) {
                  totalSgrQty += item.qty;
                }
              }
              
              if (totalSgrQty > 0) {
                const sgrProduct: Product = {
                  id: 'sgr-tax',
                  upc: 'SGR-TAX',
                  name: 'Taxa SGR',
                  price: 0.5
                };
                const sgrItem = createCartItem({ 
                  product: sgrProduct, 
                  qty: totalSgrQty, 
                  unitPrice: 0.5 
                });
                items = [...items, sgrItem];
              }
            }
            
            const next = recalcState(items, state.cashGiven);
            const itemId = findLastIdByProduct(items, product);
            return {
              ...state,
              ...next,
              selectedItemId: itemId,
              lastAction: `Adăugat ${product.name}`
            };
          });
          return { success: true, itemId: findLastIdByProduct(get().items, product), data: product };
        } catch (error) {
          return { success: false };
        }
      },
      addCustomItem: (input) => {
        const item = createCartItem(input);
        set((state) => {
          // Remove existing SGR tax items temporarily
          let items = state.items.filter(i => i.product.id !== 'sgr-tax');
          
          // Add the new item
          items = [...items, item];
          
          // Calculate total SGR quantity from all SGR products
          let totalSgrQty = 0;
          for (const i of items) {
            if (i.product.sgr && !i.storno) {
              totalSgrQty += i.qty;
            }
          }
          
          // Add SGR tax item at the end if needed
          if (totalSgrQty > 0) {
            const sgrProduct: Product = {
              id: 'sgr-tax',
              upc: 'SGR-TAX',
              name: 'Taxa SGR',
              price: 0.5
            };
            const sgrItem = createCartItem({ 
              product: sgrProduct, 
              qty: totalSgrQty, 
              unitPrice: 0.5 
            });
            items = [...items, sgrItem];
          }
          
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
      updateItem: async (id, updater) => {
        // Get the current state
        const state = get();
        
        // Find the item to update
        const currentItem = state.items.find(i => i.id === id);
        if (!currentItem) return;
        
        // Apply the updater to get the updated item
        const updatedItem = updater(currentItem);
        
        // Send update to server
        try {
          const config = await getConfig();
          const baseUrl = config.middleware?.apiBaseUrl || '';
          
          // Prepare the update payload
          const updatePayload = {
            id: updatedItem.product.id,
            upc: updatedItem.product.upc,
            name: updatedItem.product.name,
            price: updatedItem.unitPrice,
            qty: updatedItem.qty,
            percentDiscount: updatedItem.percentDiscount,
            valueDiscount: updatedItem.valueDiscount,
            storno: updatedItem.storno
          };
          
          // Send to server (same endpoint as add, but with update flag)
          await fetch(`${baseUrl}/api/articles/${encodeURIComponent(updatedItem.product.upc)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatePayload)
          });
        } catch (error) {
          console.error('Failed to update item on server:', error);
        }
        
        // Update local state
        return new Promise<void>((resolve) => {
          set((state) => {
            // Remove existing SGR tax items temporarily
            let items = state.items.filter(i => i.product.id !== 'sgr-tax');
            
            // Update the item
            items = updateCartItem(items, id, updater);
            
            // Calculate total SGR quantity from all SGR products
            let totalSgrQty = 0;
            for (const i of items) {
              if (i.product.sgr && !i.storno) {
                totalSgrQty += i.qty;
              }
            }
            
            // Add SGR tax item at the end if needed
            if (totalSgrQty > 0) {
              const sgrProduct: Product = {
                id: 'sgr-tax',
                upc: 'SGR-TAX',
                name: 'Taxa SGR',
                price: 0.5
              };
              const sgrItem = createCartItem({ 
                product: sgrProduct, 
                qty: totalSgrQty, 
                unitPrice: 0.5 
              });
              items = [...items, sgrItem];
            }
            
            const next = recalcState(items, state.cashGiven);
            resolve();
            return {
              ...state,
              ...next,
              lastAction: `Actualizat linia`
            };
          });
        });
      },
      removeItem: async (id) => {
        // Get the current state
        const state = get();
        
        // Find the item to delete
        const itemToDelete = state.items.find(i => i.id === id);
        if (!itemToDelete) return;
        
        // Send delete to server (don't delete SGR tax from server)
        if (itemToDelete.product.id !== 'sgr-tax') {
          try {
            const config = await getConfig();
            const baseUrl = config.middleware?.apiBaseUrl || '';
            
            // Send DELETE request to server
            await fetch(`${baseUrl}/api/articles/${encodeURIComponent(itemToDelete.product.upc)}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              }
            });
          } catch (error) {
            console.error('Failed to delete item on server:', error);
          }
        }
        
        // Update local state
        return new Promise<void>((resolve) => {
          set((state) => {
            // Remove the item
            let items = removeCartItem(state.items, id);
            
            // Remove existing SGR tax items
            items = items.filter(i => i.product.id !== 'sgr-tax');
            
            // Calculate total SGR quantity from all SGR products
            let totalSgrQty = 0;
            for (const i of items) {
              if (i.product.sgr && !i.storno) {
                totalSgrQty += i.qty;
              }
            }
            
            // Add SGR tax item at the end if needed
            if (totalSgrQty > 0) {
              const sgrProduct: Product = {
                id: 'sgr-tax',
                upc: 'SGR-TAX',
                name: 'Taxa SGR',
                price: 0.5
              };
              const sgrItem = createCartItem({ 
                product: sgrProduct, 
                qty: totalSgrQty, 
                unitPrice: 0.5 
              });
              items = [...items, sgrItem];
            }
            
            const next = recalcState(items, state.cashGiven);
            resolve();
            return {
              ...state,
              ...next,
              selectedItemId: next.items.at(-1)?.id,
              lastAction: `Produs șters`
            };
          });
        });
      },
      moveItemUp: (id) =>
        set((state) => {
          // Don't allow moving SGR tax item
          const item = state.items.find(i => i.id === id);
          if (item?.product.id === 'sgr-tax') return state;
          
          return {
            ...state,
            items: moveItem(state.items, id, "up"),
            lastAction: "Mutat produs"
          };
        }),
      moveItemDown: (id) =>
        set((state) => {
          // Don't allow moving SGR tax item
          const item = state.items.find(i => i.id === id);
          if (item?.product.id === 'sgr-tax') return state;
          
          return {
            ...state,
            items: moveItem(state.items, id, "down"),
            lastAction: "Mutat produs"
          };
        }),
      toggleStorno: (id) =>
        set((state) => {
          // Remove existing SGR tax items temporarily
          let items = state.items.filter(i => i.product.id !== 'sgr-tax');
          
          // Toggle storno on the item
          items = updateCartItem(items, id, (item) => ({
            ...item,
            storno: !item.storno
          }));
          
          // Calculate total SGR quantity from all SGR products (excluding storno)
          let totalSgrQty = 0;
          for (const i of items) {
            if (i.product.sgr && !i.storno) {
              totalSgrQty += i.qty;
            }
          }
          
          // Add SGR tax item at the end if needed
          if (totalSgrQty > 0) {
            const sgrProduct: Product = {
              id: 'sgr-tax',
              upc: 'SGR-TAX',
              name: 'Taxa SGR',
              price: 0.5
            };
            const sgrItem = createCartItem({ 
              product: sgrProduct, 
              qty: totalSgrQty, 
              unitPrice: 0.5 
            });
            items = [...items, sgrItem];
          }
          
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
      setCustomer: async (customer) => {
        // If id is present, fetch from API
        const id = customer.id?.toString().trim();
        if (id && id.length > 0) {
          try {
            const config = await getConfig();
            const baseUrl = config.middleware?.apiBaseUrl || '';
            const response = await fetch(`${baseUrl}/api/customers/${encodeURIComponent(id)}`);
            if (response.ok) {
              const data = await response.json();
              if (data && data.success && data.data) {
                set((state) => ({
                  ...state,
                  customer: { ...data.data },
                  lastAction: `Client ${data.data.lastName ?? data.data.id}`
                }));
                return;
              }
            }
          } catch (e) {
            // ignore fetch errors, fallback to provided customer
          }
        }
        set((state) => ({
          ...state,
          customer,
          lastAction: `Client ${customer.lastName ?? customer.id}`
        }));
      },
      setCasa: (casa) =>
        set((state) => ({
          ...state,
          casa,
          lastAction: `Casa setată la ${casa}`
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
        paymentMethod: state.paymentMethod,
        lastAction: state.lastAction
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
