import { Customer } from "../features/cart/types";

export const DEFAULT_CUSTOMER: Customer = {
  id: "default",
  type: "pf",
  lastName: "Persoană fizică",
  firstName: "1"
};

export const CUSTOMERS: Customer[] = [
  DEFAULT_CUSTOMER,
  {
    id: "c-1",
    type: "pf",
    firstName: "Ioana",
    lastName: "Popescu",
    cardId: "CARD1234",
    discountPercent: 5
  },
  {
    id: "c-2",
    type: "pj",
    firstName: "Altex",
    lastName: "Retail SRL",
    cardId: "FISC9876",
    discountPercent: 10
  }
];
