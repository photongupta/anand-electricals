"use client";

import { useState } from "react";
import { customerSchema, type CustomerInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CustomerForm({
  onSubmit,
}: {
  onSubmit: (values: CustomerInput) => Promise<{ error?: string }>;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = customerSchema.safeParse({ name, phone: phone || null });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Invalid customer");
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
    setName("");
    setPhone("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-name">Name</Label>
        <Input id="customer-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="customer-phone">Phone</Label>
        <Input id="customer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={isSubmitting}>
        Add customer
      </Button>
    </form>
  );
}
