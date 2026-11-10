"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Customer } from "@/lib/supabase/types";
import type { CustomerInput } from "@/lib/validation";
import { CustomerList } from "@/components/ledger/CustomerList";
import { CustomerForm } from "@/components/ledger/CustomerForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function LedgerPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  async function refetch() {
    const supabase = createClient();
    const [{ data: customerData, error: customerError }, { data: balanceData, error: balanceError }] =
      await Promise.all([
        supabase.from("customers").select(),
        supabase.from("customer_balances").select(),
      ]);
    if (customerError || balanceError) {
      setLoadError((customerError ?? balanceError)?.message ?? "Failed to load customers");
      return;
    }
    setLoadError(null);
    setCustomers((customerData as Customer[]) ?? []);
    const nextBalances: Record<string, number> = {};
    for (const row of (balanceData as { customer_id: string; balance: number }[]) ?? []) {
      nextBalances[row.customer_id] = row.balance;
    }
    setBalances(nextBalances);
  }

  useEffect(() => {
    refetch();
  }, []);

  async function handleAddCustomer(values: CustomerInput): Promise<{ error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.from("customers").insert(values);
    if (error) {
      return { error: error.message };
    }
    setIsAdding(false);
    await refetch();
    return {};
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Customers</h2>
        <Button onClick={() => setIsAdding(true)}>Add customer</Button>
      </div>
      {loadError && <p className="text-sm text-destructive">{loadError}</p>}
      <CustomerList
        customers={customers}
        balances={balances}
        onSelect={(customerId) => router.push(`/ledger/${customerId}`)}
      />
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add customer</DialogTitle>
          </DialogHeader>
          <CustomerForm onSubmit={handleAddCustomer} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
