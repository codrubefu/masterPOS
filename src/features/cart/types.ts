export type PaymentMethod = "cash" | "card" | "mixed" | "modern";

export interface Customer {
  id: string;
  type: "pf" | "pj";
  firstName?: string;
  lastName?: string;
  cardId?: string;
  discountPercent?: number;
}

export interface Product {
  id: string;
  upc: string;
  name: string;
  price: number;
  vatRate?: number;
  sgr?: boolean;
}

export interface CartItem {
  id: string;
  product: Product;
  qty: number;
  unitPrice: number;
  percentDiscount?: number;
  valueDiscount?: number;
  storno?: boolean;
  sgr?: boolean;
}

export interface CartState {
  customer?: Customer;
  items: CartItem[];
  cashGiven: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  change: number;
  lastAction?: string;
  paymentMethod?: PaymentMethod;
  selectedItemId?: string;
}
