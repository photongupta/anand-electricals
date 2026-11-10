import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomerList } from "@/components/ledger/CustomerList";

describe("CustomerList", () => {
  it("shows each customer's derived balance", () => {
    render(
      <CustomerList
        customers={[{ id: "c1", name: "Ramesh", phone: null, created_at: "" }]}
        balances={{ c1: 300 }}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("Ramesh")).toBeInTheDocument();
    expect(screen.getByText(/300/)).toBeInTheDocument();
  });
});
