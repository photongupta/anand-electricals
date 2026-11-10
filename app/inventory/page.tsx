"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Product } from "@/lib/supabase/types";
import type { ProductInput } from "@/lib/validation";
import { ProductList } from "@/components/inventory/ProductList";
import { ProductForm } from "@/components/inventory/ProductForm";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function matchesSearch(product: Product, search: string) {
  const needle = search.trim().toLowerCase();
  if (!needle) return true;
  if (product.name.toLowerCase().includes(needle)) return true;
  if (product.name_hi && product.name_hi.toLowerCase().includes(needle)) return true;
  return false;
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  async function refetch() {
    const supabase = createClient();
    const { data } = await supabase.from("products").select();
    setProducts((data as Product[]) ?? []);
  }

  useEffect(() => {
    refetch();
  }, []);

  async function handleSave(values: ProductInput) {
    const supabase = createClient();
    if (editing) {
      await supabase.from("products").update(values).eq("id", editing.id);
    } else {
      await supabase.from("products").insert(values);
    }
    setEditing(null);
    setIsAdding(false);
    await refetch();
  }

  const filtered = products.filter((product) => matchesSearch(product, search));
  const dialogOpen = isAdding || editing !== null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Button onClick={() => setIsAdding(true)}>Add product</Button>
      </div>
      <ProductList products={filtered} onSelect={setEditing} />
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsAdding(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          <ProductForm initialValues={editing ?? undefined} onSubmit={handleSave} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
