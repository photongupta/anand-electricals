import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";

const base = { id: "1", name_hi: null, category: "MCBs", unit: "piece", updated_at: "" };

describe("LowStockAlert", () => {
  it("flags a product at or below its threshold", () => {
    render(<LowStockAlert products={[{ ...base, name: "MCB 32A", price: 120, stock_qty: 3, low_stock_threshold: 5 }]} />);
    expect(screen.getByText("MCB 32A")).toBeInTheDocument();
  });

  it("does not flag or crash on a product with no threshold set", () => {
    render(<LowStockAlert products={[{ ...base, name: "Spare Fuse", price: 10, stock_qty: 1, low_stock_threshold: null }]} />);
    expect(screen.queryByText("Spare Fuse")).not.toBeInTheDocument();
  });
});
