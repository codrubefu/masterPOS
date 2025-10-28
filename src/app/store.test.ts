import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./store";
import { findProductByUpc } from "../mocks/products";

const UPC = "5941234567890";

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.getState().resetCart();
  });

  it("adds products by UPC and updates totals", () => {
    const product = findProductByUpc(UPC);
    expect(product).toBeTruthy();
    useCartStore.getState().addProductByUpc(UPC, { qty: 2 });
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.qty).toBeCloseTo(2);
    expect(state.subtotal).toBeCloseTo((product?.price ?? 0) * 2);
    expect(state.total).toBeCloseTo((product?.price ?? 0) * 2);
  });

  it("overrides price and discount", () => {
    useCartStore.getState().addProductByUpc(UPC, { qty: 1, unitPrice: 100 });
    useCartStore.getState().addProductByUpc(UPC, { qty: 1, percentDiscount: 50 });
    const state = useCartStore.getState();
    expect(state.items[0]?.qty).toBeCloseTo(2);
    expect(state.items[0]?.unitPrice).toBeCloseTo(100);
    expect(state.items[0]?.percentDiscount).toBeCloseTo(50);
    expect(state.total).toBeCloseTo(100); // 2 * 100 with 50% discount applied once
  });
});
