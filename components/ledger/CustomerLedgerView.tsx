"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LedgerEntry } from "@/lib/supabase/types";
import type { LedgerEntryInput } from "@/lib/validation";
import { calculateBalance } from "@/lib/balance";
import { LedgerEntryForm } from "@/components/ledger/LedgerEntryForm";

export function CustomerLedgerView({ customerId }: { customerId: string }) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  async function refetch() {
    const supabase = createClient();
    const { data } = await supabase
      .from("ledger_entries")
      .select()
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });
    setEntries((data as LedgerEntry[]) ?? []);
  }

  useEffect(() => {
    refetch();
  }, [customerId]);

  async function handleSubmit(values: LedgerEntryInput) {
    const supabase = createClient();
    await supabase.from("ledger_entries").insert(values);
    await refetch();
  }

  const balance = calculateBalance(entries);

  return (
    <div className="flex flex-col gap-6 p-4">
      <h2 className="text-lg font-semibold">Balance: ₹{balance}</h2>
      <LedgerEntryForm customerId={customerId} onSubmit={handleSubmit} />
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id} className="flex justify-between rounded-md border p-3">
            <span>{entry.type === "credit" ? "Credit" : "Payment"}</span>
            <span>₹{entry.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
