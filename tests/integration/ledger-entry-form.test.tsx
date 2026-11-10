import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LedgerEntryForm } from "@/components/ledger/LedgerEntryForm";

describe("LedgerEntryForm", () => {
  it("shows an error and keeps the entered amount when the save fails", async () => {
    const onSubmit = vi.fn(() => Promise.resolve({ error: "Network error" }));
    render(<LedgerEntryForm customerId="c1" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument());
    expect(screen.queryByText(/saved/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toHaveValue(500);
  });

  it("clears the form and shows a confirmation only when the save succeeds", async () => {
    const onSubmit = vi.fn(() => Promise.resolve({}));
    render(<LedgerEntryForm customerId="c1" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() => expect(screen.getByText(/saved/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/amount/i)).toHaveValue(null);
  });

  it("disables the submit button while the save is in flight", async () => {
    let resolveSubmit: (value: { error?: string }) => void = () => {};
    const onSubmit = vi.fn(
      () =>
        new Promise<{ error?: string }>((resolve) => {
          resolveSubmit = resolve;
        })
    );
    render(<LedgerEntryForm customerId="c1" onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/amount/i), { target: { value: "500" } });
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    expect(screen.getByRole("button", { name: /add entry/i })).toBeDisabled();
    resolveSubmit({});
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /add entry/i })).not.toBeDisabled()
    );
  });
});
