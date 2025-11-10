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
  addProductByUpc: (upc: string, input?: Partial<AddProductInput>) => Promise<{ success: boolean; itemId?: string; error?: string }>;
  addCustomItem: (input: AddProductInput) => { itemId: string };
  selectItem: (id?: string) => void;
  updateItem: (id: string, updater: (item: CartItem) => CartItem) => Promise<{ success: boolean; error?: string }>;
  removeItem: (id: string) => Promise<{ success: boolean; error?: string }>;
  moveItemUp: (id: string) => void;
  moveItemDown: (id: string) => void;
  toggleStorno: (id: string) => void;
  setCashGiven: (value: number) => void;
  setCustomer: (customer: Customer) => Promise<{ success: boolean; error?: string }>;
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

// Helper function to update SGR items by type
async function updateSgrItems(items: CartItem[], config: any) {
  const baseUrl = config.middleware?.apiBaseUrl || '';
  
  // Calculate quantities for each SGR type
  const sgrQuantities = {
    'PET': 0,
    'Sticla': 0,
    'Doza': 0
  };
  
  for (const item of items) {
    if (item.product.sgr && !item.storno) {
      const sgrType = item.product.sgr.trim().toUpperCase();
      if (sgrType === 'PET') {
        sgrQuantities.PET += item.qty;
      } else if (sgrType === 'STICLA') {
        sgrQuantities.Sticla += item.qty;
      } else if (sgrType === 'DOZA') {
        sgrQuantities.Doza += item.qty;
      }
    }
  }
  
  // Send updates for each SGR type
  const sgrProducts = [
    { type: 'PET', id: '1112', upc: '1112', name: 'Returnare Garantie SGR PET', qty: sgrQuantities.PET },
    { type: 'Doza', id: '1113', upc: '1113', name: 'Returnare Garantie SGR Doza', qty: sgrQuantities.Doza },
    { type: 'Sticla', id: '1114', upc: '1114', name: 'Returnare Garantie SGR Sticla', qty: sgrQuantities.Sticla }
  ];
  
  for (const sgr of sgrProducts) {
    if (sgr.qty > 0) {
      const updatePayload = {
        id: sgr.id.padEnd(20),
        name: sgr.name.padEnd(40),
        upc: sgr.upc.padEnd(20),
        price: 0.5,
        quantity: sgr.qty,
        sgr: ''.padEnd(50)
      };
      
      try {
        await fetch(`${baseUrl}/api/articles/${encodeURIComponent(sgr.upc)}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updatePayload)
        });
      } catch (error) {
        console.error(`Failed to update SGR ${sgr.type}:`, error);
      }
    }
  }
}

// Helper function to recalculate and add SGR tax items locally
function addSgrTaxItems(items: CartItem[]): CartItem[] {
  // Remove existing SGR tax items
  items = items.filter(item => !['1112', '1113', '1114'].includes(item.product.id));
  
  // Calculate quantities for each SGR type
  const sgrQuantities = {
    'PET': 0,
    'Sticla': 0,
    'Doza': 0
  };
  
  for (const item of items) {
    if (item.product.sgr && !item.storno) {
      const sgrType = item.product.sgr.trim().toUpperCase();
      if (sgrType === 'PET') {
        sgrQuantities.PET += item.qty;
      } else if (sgrType === 'STICLA') {
        sgrQuantities.Sticla += item.qty;
      } else if (sgrType === 'DOZA') {
        sgrQuantities.Doza += item.qty;
      }
    }
  }
  
  // Add SGR tax items
  if (sgrQuantities.PET > 0) {
    const sgrProduct: Product = {
      id: '1112',
      upc: '1112',
      name: 'Returnare Garantie SGR PET',
      price: 0.5
    };
    items.push(createCartItem({ product: sgrProduct, qty: sgrQuantities.PET, unitPrice: 0.5 }));
  }
  
  if (sgrQuantities.Doza > 0) {
    const sgrProduct: Product = {
      id: '1113',
      upc: '1113',
      name: 'Returnare Garantie SGR Doza',
      price: 0.5
    };
    items.push(createCartItem({ product: sgrProduct, qty: sgrQuantities.Doza, unitPrice: 0.5 }));
  }
  
  if (sgrQuantities.Sticla > 0) {
    const sgrProduct: Product = {
      id: '1114',
      upc: '1114',
      name: 'Returnare Garantie SGR Sticla',
      price: 0.5
    };
    items.push(createCartItem({ product: sgrProduct, qty: sgrQuantities.Sticla, unitPrice: 0.5 }));
  }
  
  return items;
}

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
          if (!response.ok) {
            try {
              const errorJson = await response.json();
              return { success: false, error: errorJson.message || `Server error: ${response.status}` };
            } catch {
              const errorText = await response.text();
              return { success: false, error: errorText || `Server error: ${response.status}` };
            }
          }
          const apiResponse = await response.json();
          if (!apiResponse.success || !apiResponse.data) {
            return { success: false, error: apiResponse.message || 'Product not found or invalid response' };
          }
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
            // Add the new product
            let items = mergeItems(state.items, product, qty, overrides);
            
            // Recalculate and add SGR tax items
            items = addSgrTaxItems(items);
            
            const next = recalcState(items, state.cashGiven);
            const itemId = findLastIdByProduct(items, product);
            return {
              ...state,
              ...next,
              selectedItemId: itemId,
              lastAction: `Adăugat ${product.name}`
            };
          });
          
          // Update SGR items on server
          if (product.sgr) {
            await updateSgrItems(get().items, config);
          }
          
          return { success: true, itemId: findLastIdByProduct(get().items, product), data: product };
        } catch (error) {
          return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
      },
      addCustomItem: (input) => {
        const item = createCartItem(input);
        set((state) => {
          // Add the new item
          let items = [...state.items, item];
          
          // Recalculate and add SGR tax items
          items = addSgrTaxItems(items);
          
          const next = recalcState(items, state.cashGiven);
          return {
            ...state,
            ...next,
            selectedItemId: item.id,
            lastAction: `Adăugat ${item.product.name}`
          };
        });
        
        // Update SGR items on server if needed
        if (item.product.sgr) {
          getConfig().then(config => {
            updateSgrItems(get().items, config);
          });
        }
        
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
        if (!currentItem) return { success: false, error: 'Item not found' };
        
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
          const response = await fetch(`${baseUrl}/api/articles/${encodeURIComponent(updatedItem.product.upc)}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatePayload)
          });
          
          if (!response.ok) {
            try {
              const errorJson = await response.json();
              return { success: false, error: errorJson.message || `Server error: ${response.status}` };
            } catch {
              const errorText = await response.text();
              return { success: false, error: errorText || `Server error: ${response.status}` };
            }
          }
          
          // Get the updated array from server response
          const apiResponse = await response.json();
          if (!apiResponse.success || !apiResponse.data) {
            return { success: false, error: apiResponse.message || 'Invalid response from server' };
          }
          
          // Update local state with the server response
          return new Promise<{ success: boolean; error?: string; data?: any }>((resolve) => {
            set((state) => {
              // Update the item with server data - use ?? with original updatedItem values
              let items = updateCartItem(state.items, id, (item) => {
                const serverData = apiResponse.data;
                return {
                  ...item,
                  product: {
                    ...item.product,
                    name: serverData.name ?? item.product.name,
                    price: serverData.price ?? item.product.price,
                  },
                  qty: serverData.qty ?? updatedItem.qty,
                  unitPrice: serverData.price ?? updatedItem.unitPrice,
                  percentDiscount: serverData.percentDiscount ?? updatedItem.percentDiscount,
                  valueDiscount: serverData.valueDiscount ?? updatedItem.valueDiscount,
                  storno: serverData.storno ?? updatedItem.storno
                };
              });
              
              // Recalculate and add SGR tax items
              items = addSgrTaxItems(items);
              
              const next = recalcState(items, state.cashGiven);
              resolve({ success: true, data: apiResponse.data });
              return {
                ...state,
                ...next,
                lastAction: `Actualizat linia`
              };
            });
            
            // Update SGR items on server
            updateSgrItems(get().items, config);
          });
        } catch (error) {
          return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
      },
      removeItem: async (id) => {
        // Get the current state
        const state = get();
        
        // Find the item to delete
        const itemToDelete = state.items.find(i => i.id === id);
        if (!itemToDelete) return { success: false, error: 'Item not found' };
        
        // Send delete to server (don't delete SGR tax from server)
        if (!['1112', '1113', '1114'].includes(itemToDelete.product.id)) {
          try {
            const config = await getConfig();
            const baseUrl = config.middleware?.apiBaseUrl || '';
            
            // Send DELETE request to server
            const response = await fetch(`${baseUrl}/api/articles/${encodeURIComponent(itemToDelete.product.upc)}`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              try {
                const errorJson = await response.json();
                return { success: false, error: errorJson.message || `Server error: ${response.status}` };
              } catch {
                const errorText = await response.text();
                return { success: false, error: errorText || `Server error: ${response.status}` };
              }
            }
          } catch (error) {
            return { success: false, error: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
        }
        
        // Update local state
        return new Promise<{ success: boolean; error?: string }>((resolve) => {
          set((state) => {
            // Remove the item
            let items = removeCartItem(state.items, id);
            
            // Recalculate and add SGR tax items
            items = addSgrTaxItems(items);
            
            const next = recalcState(items, state.cashGiven);
            resolve({ success: true });
            return {
              ...state,
              ...next,
              selectedItemId: next.items.at(-1)?.id,
              lastAction: `Produs șters`
            };
          });
          
          // Update SGR items on server
          getConfig().then(config => {
            updateSgrItems(get().items, config);
          });
        });
      },
      moveItemUp: (id) =>
        set((state) => {
          // Don't allow moving SGR tax items
          const item = state.items.find(i => i.id === id);
          if (['1112', '1113', '1114'].includes(item?.product.id || '')) return state;
          
          return {
            ...state,
            items: moveItem(state.items, id, "up"),
            lastAction: "Mutat produs"
          };
        }),
      moveItemDown: (id) =>
        set((state) => {
          // Don't allow moving SGR tax items
          const item = state.items.find(i => i.id === id);
          if (['1112', '1113', '1114'].includes(item?.product.id || '')) return state;
          
          return {
            ...state,
            items: moveItem(state.items, id, "down"),
            lastAction: "Mutat produs"
          };
        }),
      toggleStorno: (id) =>
        set((state) => {
          // Toggle storno on the item
          let items = updateCartItem(state.items, id, (item) => ({
            ...item,
            storno: !item.storno
          }));
          
          // Recalculate and add SGR tax items
          items = addSgrTaxItems(items);
          
          const next = recalcState(items, state.cashGiven);
          
          // Update SGR items on server
          getConfig().then(config => {
            updateSgrItems(items, config);
          });
          
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
            
            if (!response.ok) {
              try {
                const errorJson = await response.json();
                return { success: false, error: errorJson.message || `Server error: ${response.status}` };
              } catch {
                const errorText = await response.text();
                return { success: false, error: errorText || `Server error: ${response.status}` };
              }
            }
            
            const data = await response.json();
            if (data && data.success && data.data) {
              set((state) => ({
                ...state,
                customer: { ...data.data },
                lastAction: `Client ${data.data.lastName ?? data.data.id}`
              }));
              return { success: true };
            } else {
              return { success: false, error: data.message || 'Customer not found or invalid response' };
            }
          } catch (e) {
            return { success: false, error: `Network error: ${e instanceof Error ? e.message : 'Unknown error'}` };
          }
        }
        
        set((state) => ({
          ...state,
          customer,
          lastAction: `Client ${customer.lastName ?? customer.id}`
        }));
        return { success: true };
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
