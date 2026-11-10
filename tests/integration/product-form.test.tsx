import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ProductForm } from "@/components/inventory/ProductForm";
import type { Product } from "@/lib/supabase/types";
import type { ProductInput } from "@/lib/validation";

const existingProduct: Product = {
  id: "1",
  name: "MCB 32A",
  name_hi: "एमसीबी",
  category: "MCBs",
  unit: "piece",
  price: 120,
  stock_qty: 10,
  low_stock_threshold: 5,
  updated_at: "",
};

describe("ProductForm", () => {
  it("sends null (not omitted) when an optional field is cleared on edit", async () => {
    const onSubmit = vi.fn((_values: ProductInput) => Promise.resolve({}));
    render(<ProductForm initialValues={existingProduct} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/name \(hindi\)/i), { target: { value: "" } });
    fireEvent.change(screen.getByLabelText(/low stock threshold/i), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    const submitted = onSubmit.mock.calls[0][0];
    expect(submitted.name_hi).toBeNull();
    expect(submitted.low_stock_threshold).toBeNull();
  });

  it("shows an error and does not call onSubmit's success path when saving fails", async () => {
    const onSubmit = vi.fn(() => Promise.resolve({ error: "Network error" }));
    render(<ProductForm initialValues={existingProduct} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /save/i }));

    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
  });
});
