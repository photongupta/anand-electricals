import type { Customer } from "@/lib/supabase/types";

export function CustomerList({
  customers,
  balances,
  onSelect,
}: {
  customers: Customer[];
  balances: Record<string, number>;
  onSelect: (customerId: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {customers.map((customer) => (
        <li key={customer.id}>
          <button
            type="button"
            onClick={() => onSelect(customer.id)}
            className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-accent"
          >
            <span className="font-medium">{customer.name}</span>
            <span className="font-heading text-lg font-semibold tabular-nums">
              ₹{balances[customer.id] ?? 0}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
