"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ledgerEntrySchema, type LedgerEntryInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LedgerEntryForm({
  customerId,
  onSubmit,
}: {
  customerId: string;
  onSubmit: (values: LedgerEntryInput) => Promise<{ error?: string }>;
}) {
  const [type, setType] = useState<"credit" | "payment">("credit");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!justSaved) return;
    const timeout = setTimeout(() => setJustSaved(false), 1200);
    return () => clearTimeout(timeout);
  }, [justSaved]);

  async function handleSubmit(e: React.FormEvent) {
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
    setIsSubmitting(true);
    const { error: submitError } = await onSubmit(result.data);
    setIsSubmitting(false);
    if (submitError) {
      setError(submitError);
      return;
    }
    setAmount("");
    setNote("");
    setJustSaved(true);
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
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting}>
          Add entry
        </Button>
        <AnimatePresence>
          {justSaved && (
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              className="font-heading text-sm font-semibold text-brand-copper"
            >
              Saved ✓
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
