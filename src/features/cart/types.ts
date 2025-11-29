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
    departament?: number;
    gest?: string;
    tax1?: number;
    tax2?: number;
    tax3?: number;
    sgr?: string; // SGR type: "PET", "Sticla", "Doza"
}

export interface CartItem {
  id: string;
  product: Product;
  qty: number;
  unitPrice: number;
  percentDiscount?: number;
  valueDiscount?: number;
  storno?: boolean;
  casa?: number;
}

export interface CartState {
  customer?: Customer;
  items: CartItem[];
  cashGiven: number;
  codFiscal: string;
  bonuriValorice: number;
  cardAmount: number;
  numerarAmount: number;
  subtotal: number;
  totalDiscount: number;
  total: number;
  change: number;
  lastAction?: string;
  paymentMethod?: PaymentMethod;
  selectedItemId?: string;
  pendingPayment?: {
    bon_no: number;
    processed_at: string;
    type?: PaymentMethod;
  };
}
