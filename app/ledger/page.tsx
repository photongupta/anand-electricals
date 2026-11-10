"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Customer, LedgerEntry } from "@/lib/supabase/types";
import { calculateBalance } from "@/lib/balance";
import { CustomerList } from "@/components/ledger/CustomerList";

export default function LedgerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: customerData }, { data: entryData }] = await Promise.all([
        supabase.from("customers").select(),
        supabase.from("ledger_entries").select(),
      ]);
      setCustomers((customerData as Customer[]) ?? []);
      setEntries((entryData as LedgerEntry[]) ?? []);
    }
    load();
  }, []);

  const balances: Record<string, number> = {};
  for (const customer of customers) {
    const customerEntries = entries.filter((entry) => entry.customer_id === customer.id);
    balances[customer.id] = calculateBalance(customerEntries);
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold">Customers</h2>
      <CustomerList
        customers={customers}
        balances={balances}
        onSelect={(customerId) => router.push(`/ledger/${customerId}`)}
      />
    </div>
  );
}
