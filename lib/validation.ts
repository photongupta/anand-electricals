import { z } from "zod";

export const productSchema = z.object({
  name: z.string().trim().min(1),
  name_hi: z.string().nullable().optional(),
  category: z.string().trim().min(1),
  unit: z.string().trim().min(1),
  price: z.number().gt(0),
  stock_qty: z.number().gte(0),
  low_stock_threshold: z.number().gte(0).nullable().optional(),
});

export type ProductInput = z.infer<typeof productSchema>;

export const ledgerEntrySchema = z.object({
  customer_id: z.string().trim().min(1),
  type: z.enum(["credit", "payment"]),
  amount: z.number().gt(0),
  note: z.string().optional(),
});

export type LedgerEntryInput = z.infer<typeof ledgerEntrySchema>;

export const customerSchema = z.object({
  name: z.string().trim().min(1),
  phone: z.string().trim().min(1).nullable().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
