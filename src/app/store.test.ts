import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "./store";

const UPC = "5941234567890";
const API_BASE_URL = "http://localhost:8082";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function mockArticleLookup(upc: string, body: unknown, status = 200) {
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = typeof input === "string" ? input : input.url;

    if (url.endsWith("/config-dev.json")) {
      return jsonResponse({ middleware: { apiBaseUrl: API_BASE_URL } });
    }

    if (url === `${API_BASE_URL}/api/articles/${upc}?casa=1`) {
      return jsonResponse(body, status);
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  });
}

describe("cart store", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useCartStore.getState().resetCart();
  });

  it("adds products by UPC and updates totals", async () => {
    mockArticleLookup(UPC, {
      success: true,
      data: {
        id: "1",
        name: "Apa plata",
        upc: UPC,
        price: 5.5
      }
    });

    await useCartStore.getState().addProductByUpc(UPC, { qty: 2 });
    const state = useCartStore.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.qty).toBeCloseTo(2);
  });

  it("overrides price and discount", async () => {
    mockArticleLookup(UPC, {
      success: true,
      data: {
        id: "1",
        name: "Apa plata",
        upc: UPC,
        price: 5.5
      }
    });

    await useCartStore.getState().addProductByUpc(UPC, { qty: 1, unitPrice: 100 });
    await useCartStore.getState().addProductByUpc(UPC, { qty: 1, percentDiscount: 50 });
    const state = useCartStore.getState();
    expect(state.items[0]?.qty).toBeCloseTo(2);
    expect(state.items[0]?.unitPrice).toBeCloseTo(100);
    expect(state.items[0]?.percentDiscount).toBeCloseTo(50);
  });

  it("adds a visible cart line when the scanned product is not found", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url.endsWith("/config-dev.json")) {
        return jsonResponse({ middleware: { apiBaseUrl: API_BASE_URL } });
      }

      if (url === `${API_BASE_URL}/api/articles/000404?casa=1`) {
        return new Response(null, { status: 404 });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const result = await useCartStore.getState().addProductByUpc("000404");
    const state = useCartStore.getState();

    expect(result.success).toBe(false);
    expect(result.error).toBe("Produsul cu codul 000404 nu a fost gasit");
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.product.upc).toBe("000404");
    expect(state.items[0]?.product.name).toBe("Produs negasit (000404)");
    expect(state.items[0]?.unitPrice).toBe(0);
  });

  it("removes missing products only from the store without calling the delete API", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const url = typeof input === "string" ? input : input.url;

      if (url.endsWith("/config-dev.json")) {
        return jsonResponse({ middleware: { apiBaseUrl: API_BASE_URL } });
      }

      if (url === `${API_BASE_URL}/api/articles/000404?casa=1`) {
        return new Response(null, { status: 404 });
      }

      if (init?.method === "DELETE") {
        throw new Error("Delete API should not be called for missing products");
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    await useCartStore.getState().addProductByUpc("000404");
    const missingItemId = useCartStore.getState().items[0]?.id;

    expect(missingItemId).toBeTruthy();

    const result = await useCartStore.getState().removeItem(missingItemId as string);
    const state = useCartStore.getState();
    const deleteCalls = fetchSpy.mock.calls.filter(([, init]) => init?.method === "DELETE");

    expect(result.success).toBe(true);
    expect(state.items).toHaveLength(0);
    expect(deleteCalls).toHaveLength(0);
  });
});
