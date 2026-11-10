import type { Product } from "@/lib/supabase/types";

export function ProductList({
  products,
  onSelect,
}: {
  products: Product[];
  onSelect: (product: Product) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {products.map((product) => (
        <li key={product.id}>
          <button
            type="button"
            onClick={() => onSelect(product)}
            className="flex w-full items-center justify-between rounded-md border p-3 text-left hover:bg-accent"
          >
            <span className="flex flex-col">
              <span className="font-medium">{product.name}</span>
              {product.name_hi && (
                <span className="text-sm text-muted-foreground">{product.name_hi}</span>
              )}
              <span className="text-sm text-muted-foreground">
                {product.stock_qty} {product.unit} in stock
              </span>
            </span>
            <span className="font-heading text-lg font-semibold tabular-nums">
              ₹{product.price}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
