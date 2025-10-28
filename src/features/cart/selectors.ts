import type { CartState } from "./types";

export const selectCartItems = (state: CartState) => state.items;
export const selectSelectedItemId = (state: CartState) => state.selectedItemId;
export const selectTotals = (state: CartState) => ({
  subtotal: state.subtotal,
  totalDiscount: state.totalDiscount,
  total: state.total,
  change: state.change,
  cashGiven: state.cashGiven
});
export const selectPaymentMethod = (state: CartState) => state.paymentMethod;
