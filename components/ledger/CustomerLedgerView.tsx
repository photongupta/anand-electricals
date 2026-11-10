"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer, LedgerEntry } from "@/lib/supabase/types";
import type { LedgerEntryInput } from "@/lib/validation";
import { calculateBalance } from "@/lib/balance";
import { LedgerEntryForm } from "@/components/ledger/LedgerEntryForm";

export function CustomerLedgerView({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    const [{ data: customerData, error: customerError }, { data: entryData, error: entryError }] =
      await Promise.all([
        supabase.from("customers").select().eq("id", customerId).single(),
        supabase
          .from("ledger_entries")
          .select()
          .eq("customer_id", customerId)
          .order("created_at", { ascending: false }),
      ]);
    if (customerError || entryError) {
      setLoadError((customerError ?? entryError)?.message ?? "Failed to load ledger");
      return;
    }
    setLoadError(null);
    setCustomer(customerData as Customer);
    setEntries((entryData as LedgerEntry[]) ?? []);
  }, [customerId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  async function handleSubmit(values: LedgerEntryInput): Promise<{ error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.from("ledger_entries").insert(values);
    if (error) {
      return { error: error.message };
    }
    await refetch();
    return {};
  }

  const balance = calculateBalance(entries);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-lg font-semibold">
        {customer?.name ?? "Customer"} — Balance: ₹{balance}
      </h2>
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      <LedgerEntryForm customerId={customerId} onSubmit={handleSubmit} />
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-1 rounded-md border p-3">
            <div className="flex justify-between">
              <span>{entry.type === "credit" ? "Credit" : "Payment"}</span>
              <span>₹{entry.amount}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{entry.note ?? ""}</span>
              <span>{new Date(entry.created_at).toLocaleDateString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
