import { describe, it, expect } from "vitest";
import { productSchema, ledgerEntrySchema } from "@/lib/validation";

describe("productSchema", () => {
  it("rejects an empty or whitespace-only name", () => {
    expect(productSchema.safeParse({ name: "   ", category: "Wires", unit: "piece", price: 10, stock_qty: 5 }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(productSchema.safeParse({ name: "MCB", category: "MCBs", unit: "piece", price: -1, stock_qty: 5 }).success).toBe(false);
  });

  it("rejects a negative stock_qty", () => {
    expect(productSchema.safeParse({ name: "MCB", category: "MCBs", unit: "piece", price: 10, stock_qty: -1 }).success).toBe(false);
  });

  it("accepts a valid product", () => {
    expect(productSchema.safeParse({ name: "MCB 32A", category: "MCBs", unit: "piece", price: 120, stock_qty: 10 }).success).toBe(true);
  });
});

describe("ledgerEntrySchema", () => {
  it("rejects a zero amount", () => {
    expect(ledgerEntrySchema.safeParse({ customer_id: "c1", type: "credit", amount: 0 }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(ledgerEntrySchema.safeParse({ customer_id: "c1", type: "payment", amount: -50 }).success).toBe(false);
  });

  it("accepts a valid entry", () => {
    expect(ledgerEntrySchema.safeParse({ customer_id: "c1", type: "credit", amount: 300 }).success).toBe(true);
  });
});
