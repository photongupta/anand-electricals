"use client";

import { motion } from "framer-motion";
import type { Product } from "@/lib/supabase/types";

export function LowStockAlert({ products }: { products: Product[] }) {
  const lowStock = products.filter(
    (product) =>
      product.low_stock_threshold !== null &&
      product.stock_qty <= product.low_stock_threshold
  );

  if (lowStock.length === 0) {
    return <p className="text-sm text-muted-foreground">No low-stock products.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {lowStock.map((product, index) => (
        <motion.li
          key={product.id}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: index * 0.05 }}
          className="flex items-center justify-between rounded-md border border-destructive/50 p-3"
        >
          <span className="font-medium">{product.name}</span>
          <span className="font-heading font-semibold text-destructive tabular-nums">
            {product.stock_qty} {product.unit} left
          </span>
        </motion.li>
      ))}
    </ul>
  );
}
