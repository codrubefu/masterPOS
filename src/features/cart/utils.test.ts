import { describe, expect, it } from "vitest";
import { createCartItem, calculateLineTotals } from "./utils";
import type { Product } from "./types";

const product: Product = {
  id: "test",
  upc: "0001",
  name: "Produs test",
  price: 10
};

describe("cart utils", () => {
  it("applies value discount with priority over percent", () => {
    const item = createCartItem({
      product,
      qty: 2,
      unitPrice: 10,
      percentDiscount: 50,
      valueDiscount: 3
    });
    const totals = calculateLineTotals(item);
    expect(totals.discount).toBeCloseTo(3);
    expect(totals.total).toBeCloseTo(17);
  });

  it("applies percentage discount when no value discount is provided", () => {
    const item = createCartItem({
      product,
      qty: 3,
      unitPrice: 10,
      percentDiscount: 10
    });
    const totals = calculateLineTotals(item);
    expect(totals.discount).toBeCloseTo(3);
    expect(totals.total).toBeCloseTo(27);
  });
});
