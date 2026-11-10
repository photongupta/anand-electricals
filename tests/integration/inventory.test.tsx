import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import InventoryPage from "@/app/inventory/page";

const products = [
  { id: "1", name: "MCB 32A", name_hi: null, category: "MCBs", unit: "piece", price: 120, stock_qty: 10, low_stock_threshold: 5, updated_at: "" },
  { id: "2", name: "Copper Wire 1.5mm", name_hi: "तांबे का तार", category: "Wires", unit: "meter", price: 15, stock_qty: 200, low_stock_threshold: 20, updated_at: "" },
];

const deleteSpy = vi.fn(() => Promise.resolve({ error: null }));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => Promise.resolve({ data: products, error: null }),
      delete: () => ({ eq: deleteSpy }),
    }),
  }),
}));

describe("InventoryPage", () => {
  it("filters the product list by search text", async () => {
    render(<InventoryPage />);
    expect(await screen.findByText("MCB 32A")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "copper" } });
    expect(screen.queryByText("MCB 32A")).not.toBeInTheDocument();
    expect(screen.getByText("Copper Wire 1.5mm")).toBeInTheDocument();
  });

  it("deletes a product when Delete product is clicked in the edit dialog", async () => {
    render(<InventoryPage />);
    fireEvent.click(await screen.findByText("MCB 32A"));
    fireEvent.click(await screen.findByRole("button", { name: /delete product/i }));
    await waitFor(() => expect(deleteSpy).toHaveBeenCalledWith("id", "1"));
  });
});
