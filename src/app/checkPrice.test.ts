import { beforeEach, describe, expect, it, vi } from "vitest";

const API_BASE_URL = "http://localhost:8082";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("fetchProductInfoByUpc", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns the popup message when the article API responds with 404", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url.endsWith("/config-dev.json")) {
        return jsonResponse({ middleware: { apiBaseUrl: API_BASE_URL } });
      }

      if (url === `${API_BASE_URL}/api/articles/234234`) {
        return new Response(null, { status: 404 });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const { fetchProductInfoByUpc } = await import("./checkPrice");
    const result = await fetchProductInfoByUpc("234234");

    expect(result).toEqual({
      success: false,
      error: "Produsul nu a fost gasit"
    });
  });

  it("returns the same popup message for network errors", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = typeof input === "string" ? input : input.url;

      if (url.endsWith("/config-dev.json")) {
        return jsonResponse({ middleware: { apiBaseUrl: API_BASE_URL } });
      }

      if (url === `${API_BASE_URL}/api/articles/234234`) {
        throw new Error("Network down");
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    const { fetchProductInfoByUpc } = await import("./checkPrice");
    const result = await fetchProductInfoByUpc("234234");

    expect(result).toEqual({
      success: false,
      error: "Produsul nu a fost gasit"
    });
  });
});