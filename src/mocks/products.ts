import { Product } from "../features/cart/types";

export const PRODUCTS: Product[] = [
  { id: "1", upc: "5941234567890", name: "Cafea boabe 1kg", price: 79.9 },
  { id: "2", upc: "5940987654321", name: "Lapte 1L", price: 5.49 },
  { id: "3", upc: "5940001112223", name: "Pâine integrală", price: 8.25 },
  { id: "4", upc: "5945557770001", name: "Ciocolată neagră 85%", price: 12.35 },
  { id: "5", upc: "5942228889999", name: "Ulei de măsline extra virgin 750ml", price: 42.5 },
  { id: "6", upc: "5941111222333", name: "Bere sticlă 0.5L", price: 4.99, sgr: true },
  { id: "7", upc: "5942223334445", name: "Apă minerală PET 2L", price: 3.50, sgr: true }
];

export function findProductByUpc(upc: string): Product | undefined {
  return PRODUCTS.find((product) => product.upc === upc.trim());
}

export function searchProducts(query: string): Product[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];
  return PRODUCTS.filter((product) =>
    product.name.toLowerCase().includes(term) || product.upc.includes(term)
  );
}
