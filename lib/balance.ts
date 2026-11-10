import type { LedgerEntry } from "@/lib/supabase/types";

export function calculateBalance(entries: LedgerEntry[]): number {
  return entries.reduce(
    (balance, entry) =>
      entry.type === "credit" ? balance + entry.amount : balance - entry.amount,
    0
  );
}
