"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/supabase/types";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [outstandingCount, setOutstandingCount] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [
        { data: productData, error: productError },
        { data: balanceData, error: balanceError },
      ] = await Promise.all([
        supabase.from("products").select(),
        supabase.from("customer_balances").select(),
      ]);
      if (productError || balanceError) {
        setLoadError((productError ?? balanceError)?.message ?? "Failed to load dashboard");
        return;
      }
      setLoadError(null);
      setProducts((productData as Product[]) ?? []);
      const balances = (balanceData as { customer_id: string; balance: number }[]) ?? [];
      setOutstandingCount(balances.filter((row) => row.balance > 0).length);
    }
    load();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4">
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
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
      <section className="flex gap-3">
        <Link href="/inventory" className="text-primary hover:underline">
          Go to Inventory
        </Link>
        <Link href="/ledger" className="text-primary hover:underline">
          Go to Ledger
        </Link>
      </section>
    </div>
  );
}
