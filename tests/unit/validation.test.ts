import { describe, it, expect } from "vitest";
import { productSchema, ledgerEntrySchema, customerSchema } from "@/lib/validation";

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

  it("accepts an explicit null for name_hi and low_stock_threshold (clearing them on edit)", () => {
    const result = productSchema.safeParse({
      name: "MCB 32A",
      name_hi: null,
      category: "MCBs",
      unit: "piece",
      price: 120,
      stock_qty: 10,
      low_stock_threshold: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name_hi).toBeNull();
      expect(result.data.low_stock_threshold).toBeNull();
    }
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

describe("customerSchema", () => {
  it("rejects an empty or whitespace-only name", () => {
    expect(customerSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("accepts a name with no phone", () => {
    expect(customerSchema.safeParse({ name: "Ramesh" }).success).toBe(true);
  });

  it("accepts a name with a phone", () => {
    expect(customerSchema.safeParse({ name: "Ramesh", phone: "9876543210" }).success).toBe(true);
  });
});
