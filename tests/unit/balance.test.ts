import { describe, it, expect } from "vitest";
import { calculateBalance } from "@/lib/balance";
import type { LedgerEntry } from "@/lib/supabase/types";

const entry = (type: "credit" | "payment", amount: number): LedgerEntry => ({
  id: crypto.randomUUID(),
  customer_id: "c1",
  type,
  amount,
  note: null,
  created_at: new Date().toISOString(),
});

describe("calculateBalance", () => {
  it("returns 0 for a customer with no entries", () => {
    expect(calculateBalance([])).toBe(0);
  });

  it("sums credits and subtracts payments", () => {
    expect(calculateBalance([entry("credit", 500), entry("payment", 200)])).toBe(300);
  });

  it("never goes negative in result when payments exceed credits (returns the true negative value)", () => {
    expect(calculateBalance([entry("credit", 100), entry("payment", 150)])).toBe(-50);
  });
});
