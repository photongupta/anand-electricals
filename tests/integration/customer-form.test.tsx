import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CustomerForm } from "@/components/ledger/CustomerForm";
import type { CustomerInput } from "@/lib/validation";

describe("CustomerForm", () => {
  it("rejects an empty name without calling onSubmit", () => {
    const onSubmit = vi.fn((_values: CustomerInput) => Promise.resolve({}));
    render(<CustomerForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /add customer/i }));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits a valid name and clears the form on success", async () => {
    const onSubmit = vi.fn((_values: CustomerInput) => Promise.resolve({}));
    render(<CustomerForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Ramesh" } });
    fireEvent.click(screen.getByRole("button", { name: /add customer/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: "Ramesh", phone: null }));
    await waitFor(() => expect(screen.getByLabelText(/name/i)).toHaveValue(""));
  });
});
