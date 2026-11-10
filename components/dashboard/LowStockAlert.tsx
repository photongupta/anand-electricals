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
      {lowStock.map((product) => (
        <li
          key={product.id}
          className="flex items-center justify-between rounded-md border border-destructive/50 p-3"
        >
          <span className="font-medium">{product.name}</span>
          <span className="text-sm text-destructive">
            {product.stock_qty} {product.unit} left
          </span>
        </li>
      ))}
    </ul>
  );
}
