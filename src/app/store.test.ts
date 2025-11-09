import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "./store";

const UPC = "5941234567890";

describe("cart store", () => {
  beforeEach(() => {
    useCartStore.getState().resetCart();
  });

  it("adds products by UPC and updates totals", async () => {
    await useCartStore.getState().addProductByUpc(UPC, { qty: 2 });
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.qty).toBeCloseTo(2);
  });

  it("overrides price and discount", async () => {
    await useCartStore.getState().addProductByUpc(UPC, { qty: 1, unitPrice: 100 });
    await useCartStore.getState().addProductByUpc(UPC, { qty: 1, percentDiscount: 50 });
    const state = useCartStore.getState();
    expect(state.items[0]?.qty).toBeCloseTo(2);
    expect(state.items[0]?.unitPrice).toBeCloseTo(100);
    expect(state.items[0]?.percentDiscount).toBeCloseTo(50);
  });
});
