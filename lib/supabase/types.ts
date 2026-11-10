export type Product = {
  id: string;
  name: string;
  name_hi: string | null;
  category: string;
  unit: string;
  price: number;
  stock_qty: number;
  low_stock_threshold: number | null;
  updated_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  created_at: string;
};

export type LedgerEntryType = "credit" | "payment";

export type LedgerEntry = {
  id: string;
  customer_id: string;
  type: LedgerEntryType;
  amount: number;
  note: string | null;
  created_at: string;
};
