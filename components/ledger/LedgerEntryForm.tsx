"use client";

import { useState } from "react";
import { ledgerEntrySchema, type LedgerEntryInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LedgerEntryForm({
  customerId,
  onSubmit,
}: {
  customerId: string;
  onSubmit: (values: LedgerEntryInput) => void;
}) {
  const [type, setType] = useState<"credit" | "payment">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = ledgerEntrySchema.safeParse({
      customer_id: customerId,
      type,
      amount: Number(amount),
      note: note || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid entry");
      return;
    }
    setError(null);
    onSubmit(result.data);
    setAmount("");
    setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={type === "credit" ? "default" : "outline"}
          onClick={() => setType("credit")}
        >
          Credit
        </Button>
        <Button
          type="button"
          variant={type === "payment" ? "default" : "outline"}
          onClick={() => setType("payment")}
        >
          Payment
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="note">Note</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit">Add entry</Button>
    </form>
  );
}
