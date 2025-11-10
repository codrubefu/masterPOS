import { nanoid } from "nanoid/non-secure";
import { roundMoney } from "../../lib/money";
import type { CartItem, CartState, Product } from "./types";

export interface AddProductInput {
  product: Product;
  qty?: number;
  unitPrice?: number;
  percentDiscount?: number;
  valueDiscount?: number;
  storno?: boolean;
  casa?: number;
}

export function createCartItem(input: AddProductInput): CartItem {
  const qty = Math.max(input.qty ?? 1, 0.0001);
  const unitPrice = input.unitPrice ?? input.product.price;
  return {
    id: nanoid(),
    product: input.product,
    qty,
    unitPrice,
    percentDiscount: input.valueDiscount ? undefined : normalizePercent(input.percentDiscount),
    valueDiscount: input.valueDiscount ? Math.max(input.valueDiscount, 0) : undefined,
    storno: input.storno ?? false,
    casa: input.casa
  };
}

export function normalizePercent(value?: number): number | undefined {
  if (value === undefined) return undefined;
  const safe = Math.max(0, Math.min(100, value));
  return Number.isFinite(safe) ? safe : undefined;
}

export function calculateLineTotals(item: CartItem) {
  const base = roundMoney(item.qty * item.unitPrice);
  const valueDiscount = item.valueDiscount ? Math.min(item.valueDiscount, base) : 0;
  const percent = !valueDiscount && item.percentDiscount ? item.percentDiscount / 100 : 0;
  const percentDiscount = percent ? roundMoney(base * percent) : 0;
  const discount = roundMoney(valueDiscount || percentDiscount);
  const total = roundMoney(base - discount) * (item.storno ? -1 : 1);
  return { base, discount, total };
}

export function computeCartState(items: CartItem[], cashGiven: number) {
  let subtotal = 0;
  let totalDiscount = 0;
  for (const item of items) {
    const { base, discount, total } = calculateLineTotals(item);
    subtotal += total;
    totalDiscount += discount * (item.storno ? -1 : 1);
  }
  subtotal = roundMoney(subtotal);
  totalDiscount = roundMoney(totalDiscount);
  const total = subtotal;
  const change = roundMoney(Math.max(cashGiven - total, 0));
  return { subtotal, totalDiscount, total, change };
}

export function mergeItems(items: CartItem[], product: Product, qty: number, overrides?: Partial<CartItem>): CartItem[] {
  const existingIndex = items.findIndex((item) => item.product.id === product.id && !item.storno);
  if (existingIndex === -1 || overrides?.storno) {
    const newItem = createCartItem({ product, qty, ...overrides });
    return [...items, newItem];
  }
  const updated = [...items];
  const item = updated[existingIndex];
  const newQty = roundMoney(item.qty + qty, 3);
  updated[existingIndex] = {
    ...item,
    qty: newQty,
    unitPrice: overrides?.unitPrice ?? item.unitPrice,
    percentDiscount: overrides?.valueDiscount
      ? undefined
      : overrides?.percentDiscount ?? item.percentDiscount,
    valueDiscount: overrides?.valueDiscount ?? item.valueDiscount
  };
  return updated;
}

export function updateCartItem(items: CartItem[], id: string, updater: (item: CartItem) => CartItem): CartItem[] {
  return items.map((item) => (item.id === id ? updater(item) : item));
}

export function removeCartItem(items: CartItem[], id: string): CartItem[] {
  return items.filter((item) => item.id !== id);
}

export function moveItem(items: CartItem[], id: string, direction: "up" | "down"): CartItem[] {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return items;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= items.length) return items;
  const copy = [...items];
  const [removed] = copy.splice(index, 1);
  copy.splice(targetIndex, 0, removed);
  return copy;
}

export function resetCart(): CartState {
  return {
    items: [],
    cashGiven: 0,
    codFiscal: '',
    bonuriValorice: 0,
    cardAmount: 0,
    numerarAmount: 0,
    subtotal: 0,
    totalDiscount: 0,
    total: 0,
    change: 0
  };
}
