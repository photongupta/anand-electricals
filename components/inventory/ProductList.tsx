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
            <span>
              <span className="font-medium">{product.name}</span>
              {product.name_hi && (
                <span className="ml-2 text-muted-foreground">{product.name_hi}</span>
              )}
            </span>
            <span className="text-sm text-muted-foreground">
              ₹{product.price} · {product.stock_qty} {product.unit}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
