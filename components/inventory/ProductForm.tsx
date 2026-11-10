"use client";

import { useState } from "react";
import type { Product } from "@/lib/supabase/types";
import { productSchema, type ProductInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProductForm({
  initialValues,
  onSubmit,
}: {
  initialValues?: Product;
  onSubmit: (values: ProductInput) => Promise<{ error?: string }>;
}) {
  const [values, setValues] = useState({
    name: initialValues?.name ?? "",
    name_hi: initialValues?.name_hi ?? "",
    category: initialValues?.category ?? "",
    unit: initialValues?.unit ?? "",
    price: initialValues?.price?.toString() ?? "",
    stock_qty: initialValues?.stock_qty?.toString() ?? "",
    low_stock_threshold: initialValues?.low_stock_threshold?.toString() ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = productSchema.safeParse({
      name: values.name,
      name_hi: values.name_hi || null,
      category: values.category,
      unit: values.unit,
      price: Number(values.price),
      stock_qty: Number(values.stock_qty),
      low_stock_threshold: values.low_stock_threshold
        ? Number(values.low_stock_threshold)
        : null,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid product");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const { error: submitError } = await onSubmit(result.data);
    setIsSubmitting(false);
    if (submitError) {
      setError(submitError);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name_hi">Name (Hindi)</Label>
        <Input
          id="name_hi"
          value={values.name_hi}
          onChange={(e) => setValues({ ...values, name_hi: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={values.category}
          onChange={(e) => setValues({ ...values, category: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="unit">Unit</Label>
        <Input
          id="unit"
          value={values.unit}
          onChange={(e) => setValues({ ...values, unit: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          type="number"
          value={values.price}
          onChange={(e) => setValues({ ...values, price: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="stock_qty">Stock quantity</Label>
        <Input
          id="stock_qty"
          type="number"
          value={values.stock_qty}
          onChange={(e) => setValues({ ...values, stock_qty: e.target.value })}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="low_stock_threshold">Low stock threshold</Label>
        <Input
          id="low_stock_threshold"
          type="number"
          value={values.low_stock_threshold}
          onChange={(e) =>
            setValues({ ...values, low_stock_threshold: e.target.value })
          }
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        Save
      </Button>
    </form>
  );
}
