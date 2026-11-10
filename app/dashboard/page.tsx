"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Customer, LedgerEntry, Product } from "@/lib/supabase/types";
import { calculateBalance } from "@/lib/balance";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: productData }, { data: customerData }, { data: entryData }] =
        await Promise.all([
          supabase.from("products").select(),
          supabase.from("customers").select(),
          supabase.from("ledger_entries").select(),
        ]);
      setProducts((productData as Product[]) ?? []);
      setCustomers((customerData as Customer[]) ?? []);
      setEntries((entryData as LedgerEntry[]) ?? []);
    }
    load();
  }, []);

  const outstandingCount = customers.filter((customer) => {
    const customerEntries = entries.filter((entry) => entry.customer_id === customer.id);
    return calculateBalance(customerEntries) > 0;
  }).length;

  return (
    <div className="flex flex-col gap-6 p-4">
      <section>
        <h2 className="mb-2 text-lg font-semibold">Low stock</h2>
        <LowStockAlert products={products} />
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Outstanding balances</h2>
        <p className="text-sm text-muted-foreground">
          {outstandingCount} customer{outstandingCount === 1 ? "" : "s"} owe money
        </p>
      </section>
    </div>
  );
}
