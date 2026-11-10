# Anand Electricals PWA v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the v1 owner-facing PWA for Anand Electricals — inventory/stock tracking, a customer credit (udhaar) ledger, and price lookup — as a Next.js + Supabase app, with no LLM/agent feature yet.

**Architecture:** Next.js (App Router) talks directly to Supabase (Postgres + Auth) from the browser via a shared client. Domain logic that must be correct (balance calculation, validation) is written as pure, independently-testable functions in `lib/`, consumed by thin page/component code. One Supabase Auth account (dad) gates every route via middleware.

**Tech Stack:** Next.js 15 (App Router) + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Supabase (`@supabase/supabase-js`, `@supabase/ssr`), `next-intl`, `zod`, Vitest + `@testing-library/react`, `@ducanh2912/next-pwa`.

**Spec:** [docs/superpowers/specs/2026-11-10-anand-electricals-pwa-design.md](../specs/2026-11-10-anand-electricals-pwa-design.md)

## Global Constraints

- Next.js 15, App Router (not Pages Router).
- Supabase free tier only; no paid add-ons assumed.
- Single Supabase Auth account for v1 — no multi-staff accounts, no role checks.
- No invoicing/sales-order/transaction-log table — stock is edited directly on `products.stock_qty`.
- No offline write queue — service worker caches shell/reads only; writes require connectivity.
- No e2e framework (Playwright etc.) — Vitest unit tests + React Testing Library integration tests only.
- Customer balance is **derived** from `ledger_entries` (sum of `credit` − sum of `payment`), never stored as a column.
- UI must support an English/Hindi toggle (`next-intl`) and must use shadcn/ui + Tailwind + Framer Motion per the approved visual design — no unstyled/default-Tailwind-gray screens.
- No LLM/agent feature of any kind in this plan — that is explicitly deferred to a future spec.

## Review Focus

- Product form accepts an empty or whitespace-only `name` → spec implies every product is identifiable; must be rejected at validation, not saved as blank. (Task 4)
- Ledger entry form accepts a zero or negative `amount` → a ₹0 or negative credit/payment is meaningless and would silently corrupt the balance; must be rejected at validation. (Task 4)
- Product form accepts a negative `price` or `stock_qty` → a reasonable owner expects these can't go negative; must be rejected at validation. (Task 4)
- A customer with zero ledger entries → balance calculation must return `0`, not `NaN` or throw, since every new customer starts here. (Task 3)
- A product with `low_stock_threshold` set to `null` → must be excluded from the dashboard's low-stock alert without the comparison throwing, since the spec marks this field nullable. (Task 7)

---

## Prerequisites (human partner, before Task 2's live verification)

These require an account and cannot be done by an agent:
1. Create a free Supabase project. Note the project URL and anon key.
2. Create one Supabase Auth user (email/password) for dad.
3. Create `.env.local` in the repo root with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set from step 1.

Tasks 1, 3–11 do not require live Supabase credentials (tests mock the Supabase client). Task 2's migration should be applied to the real project once these exist.

---

### Task 1: Project Scaffolding & Test Infrastructure

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `.eslintrc.json`, `vitest.config.ts`
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- Create: `tests/unit/sanity.test.ts`
- Create: `.env.example` (documents `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

**Interfaces:**
- Produces: a working `npm run dev`, `npm run build`, `npm run test` (Vitest), and `npm run lint`.

- [ ] **Step 1: Scaffold the Next.js app**

Run `npx create-next-app@latest .` in the repo root (TypeScript, Tailwind, App Router, ESLint — accept into the existing directory since it only contains `docs/` and `.git`).

- [ ] **Step 2: Add shadcn/ui**

Run `npx shadcn@latest init` with defaults; confirm `components.json` and `lib/utils.ts` are created.

- [ ] **Step 3: Add Vitest + React Testing Library**

Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`. Add `vitest.config.ts` with `environment: "jsdom"` and a `test` script in `package.json`.

- [ ] **Step 4: Write a sanity test**

```ts
// tests/unit/sanity.test.ts
import { describe, it, expect } from "vitest";

describe("test infrastructure", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the sanity test**

Run: `npm run test`
Expected: PASS (1 test)

- [ ] **Step 6: Verify dev server and build**

Run: `npm run dev` (confirm it starts, then stop it), then `npm run build`
Expected: both succeed with no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with shadcn/ui and Vitest"
```

---

### Task 2: Supabase Schema, Types & Client

**Files:**
- Create: `supabase/migrations/0001_init.sql`
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/client.ts`
- Test: `tests/unit/supabase-client.test.ts`

**Interfaces:**
- Produces:
  - `export type Product = { id: string; name: string; name_hi: string | null; category: string; unit: string; price: number; stock_qty: number; low_stock_threshold: number | null; updated_at: string }` (`lib/supabase/types.ts`)
  - `export type Customer = { id: string; name: string; phone: string | null; created_at: string }` (`lib/supabase/types.ts`)
  - `export type LedgerEntryType = "credit" | "payment"` and `export type LedgerEntry = { id: string; customer_id: string; type: LedgerEntryType; amount: number; note: string | null; created_at: string }` (`lib/supabase/types.ts`)
  - `export function createClient(): SupabaseClient` (`lib/supabase/client.ts`) — browser client via `@supabase/ssr`'s `createBrowserClient`, reading `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

- [ ] **Step 1: Write the migration SQL**

`supabase/migrations/0001_init.sql` creates:
- `products` and `customers` tables with the exact columns from the spec's Data Model section.
- `ledger_entries` with `type` constrained to `('credit', 'payment')` (check constraint or enum) and `customer_id` as a foreign key to `customers(id)`.
- A `customer_balances` view: `SELECT customer_id, SUM(CASE WHEN type = 'credit' THEN amount ELSE -amount END) AS balance FROM ledger_entries GROUP BY customer_id`.
- Row Level Security enabled on all three tables, with a policy allowing all operations to any authenticated user (single-account app — no per-row ownership needed).

- [ ] **Step 2: Install Supabase packages**

Install `@supabase/supabase-js` and `@supabase/ssr`.

- [ ] **Step 3: Write `lib/supabase/types.ts`** with the three types above.

- [ ] **Step 4: Write a failing test for the client factory**

```ts
// tests/unit/supabase-client.test.ts
import { describe, it, expect, vi } from "vitest";

describe("createClient", () => {
  it("throws a clear error when env vars are missing", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    expect(() => createClient()).toThrow();
  });
});
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npm run test -- supabase-client`
Expected: FAIL (`createClient` not defined)

- [ ] **Step 6: Implement `createClient()` in `lib/supabase/client.ts`**

Reads the two env vars; if either is missing/empty, throw with a message naming the missing var (don't let `createBrowserClient` fail with an opaque error).

- [ ] **Step 7: Run test to verify it passes**

Run: `npm run test -- supabase-client`
Expected: PASS

- [ ] **Step 8: Apply the migration to the live project (human partner's Supabase project from Prerequisites)**

Run `supabase db push` (Supabase CLI) or paste `0001_init.sql` into the Supabase SQL editor. Verify by inserting one test row into each table via the SQL editor and querying `customer_balances` to confirm it returns `0` for a customer with no entries. Remove the test rows afterward.

- [ ] **Step 9: Commit**

```bash
git add supabase/ lib/supabase/
git commit -m "feat: add Supabase schema, types, and client factory"
```

---

### Task 3: Core Domain Logic — Balance Calculation

**Files:**
- Create: `lib/balance.ts`
- Test: `tests/unit/balance.test.ts`

**Interfaces:**
- Consumes: `LedgerEntry` type from Task 2 (`lib/supabase/types.ts`).
- Produces: `export function calculateBalance(entries: LedgerEntry[]): number` — used by Task 7 (Dashboard) and Task 8 (Ledger).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/balance.test.ts
import { describe, it, expect } from "vitest";
import { calculateBalance } from "@/lib/balance";
import type { LedgerEntry } from "@/lib/supabase/types";

const entry = (type: "credit" | "payment", amount: number): LedgerEntry => ({
  id: crypto.randomUUID(),
  customer_id: "c1",
  type,
  amount,
  note: null,
  created_at: new Date().toISOString(),
});

describe("calculateBalance", () => {
  it("returns 0 for a customer with no entries", () => {
    expect(calculateBalance([])).toBe(0);
  });

  it("sums credits and subtracts payments", () => {
    expect(calculateBalance([entry("credit", 500), entry("payment", 200)])).toBe(300);
  });

  it("never goes negative in result when payments exceed credits (returns the true negative value)", () => {
    expect(calculateBalance([entry("credit", 100), entry("payment", 150)])).toBe(-50);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- balance`
Expected: FAIL (`calculateBalance` not defined)

- [ ] **Step 3: Implement `calculateBalance` in `lib/balance.ts`**

Reduce over `entries`: add `amount` for `type === "credit"`, subtract for `type === "payment"`; start the reduction at `0` so an empty array returns `0`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- balance`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/balance.ts tests/unit/balance.test.ts
git commit -m "feat: add derived ledger balance calculation"
```

---

### Task 4: Form Validation Schemas

**Files:**
- Create: `lib/validation.ts`
- Test: `tests/unit/validation.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `export const productSchema` (zod schema), `export type ProductInput = z.infer<typeof productSchema>`, `export const ledgerEntrySchema` (zod schema), `export type LedgerEntryInput = z.infer<typeof ledgerEntrySchema>` — used by Task 6 (Inventory) and Task 8 (Ledger).

`productSchema` fields: `name` (non-empty, trimmed), `name_hi` (optional string), `category` (non-empty), `unit` (non-empty), `price` (number, `> 0`), `stock_qty` (number, `>= 0`), `low_stock_threshold` (optional number, `>= 0` when present).

`ledgerEntrySchema` fields: `customer_id` (non-empty string), `type` (`"credit" | "payment"`), `amount` (number, `> 0`), `note` (optional string).

- [ ] **Step 1: Write the failing tests**

```ts
// tests/unit/validation.test.ts
import { describe, it, expect } from "vitest";
import { productSchema, ledgerEntrySchema } from "@/lib/validation";

describe("productSchema", () => {
  it("rejects an empty or whitespace-only name", () => {
    expect(productSchema.safeParse({ name: "   ", category: "Wires", unit: "piece", price: 10, stock_qty: 5 }).success).toBe(false);
  });

  it("rejects a negative price", () => {
    expect(productSchema.safeParse({ name: "MCB", category: "MCBs", unit: "piece", price: -1, stock_qty: 5 }).success).toBe(false);
  });

  it("rejects a negative stock_qty", () => {
    expect(productSchema.safeParse({ name: "MCB", category: "MCBs", unit: "piece", price: 10, stock_qty: -1 }).success).toBe(false);
  });

  it("accepts a valid product", () => {
    expect(productSchema.safeParse({ name: "MCB 32A", category: "MCBs", unit: "piece", price: 120, stock_qty: 10 }).success).toBe(true);
  });
});

describe("ledgerEntrySchema", () => {
  it("rejects a zero amount", () => {
    expect(ledgerEntrySchema.safeParse({ customer_id: "c1", type: "credit", amount: 0 }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(ledgerEntrySchema.safeParse({ customer_id: "c1", type: "payment", amount: -50 }).success).toBe(false);
  });

  it("accepts a valid entry", () => {
    expect(ledgerEntrySchema.safeParse({ customer_id: "c1", type: "credit", amount: 300 }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- validation`
Expected: FAIL (`productSchema`/`ledgerEntrySchema` not defined)

- [ ] **Step 3: Install zod and implement the schemas in `lib/validation.ts`**

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- validation`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/validation.ts tests/unit/validation.test.ts
git commit -m "feat: add product and ledger entry validation schemas"
```

---

### Task 5: Authentication (Login + Route Protection)

**Files:**
- Create: `app/login/page.tsx`
- Create: `middleware.ts`
- Test: `tests/integration/login.test.tsx`

**Interfaces:**
- Consumes: `createClient` from `lib/supabase/client.ts` (Task 2).
- Produces: all routes other than `/login` require an authenticated Supabase session (redirect to `/login` otherwise); a successful login redirects to `/dashboard`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/integration/login.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "@/app/login/page";

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: vi.fn(({ password }) =>
        password === "correct"
          ? Promise.resolve({ error: null })
          : Promise.resolve({ error: { message: "Invalid login credentials" } })
      ),
    },
  }),
}));

describe("LoginPage", () => {
  it("shows an error message on invalid credentials", async () => {
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "dad@anand.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: /log in/i }));
    await waitFor(() => expect(screen.getByText(/invalid login credentials/i)).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- login`
Expected: FAIL (`app/login/page.tsx` not defined)

- [ ] **Step 3: Implement `app/login/page.tsx`**

A client component: email + password inputs (labeled "Email" / "Password"), a "Log in" button, calls `createClient().auth.signInWithPassword(...)`, displays `error.message` on failure, calls `router.push("/dashboard")` on success. Styled with shadcn `Input`/`Button`/`Card`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- login`
Expected: PASS

- [ ] **Step 5: Implement `middleware.ts`**

Uses `@supabase/ssr`'s `createServerClient` to read the session from cookies; redirects to `/login` for any request path other than `/login` (and Next.js internals/static assets) when there is no session.

- [ ] **Step 6: Manual verification**

Start the dev server, confirm visiting `/dashboard` while logged out redirects to `/login`, and (once Prerequisites' Supabase user exists) that a correct login redirects to `/dashboard`.

- [ ] **Step 7: Commit**

```bash
git add app/login/ middleware.ts tests/integration/login.test.tsx
git commit -m "feat: add login page and auth route protection"
```

---

### Task 6: Inventory Feature (CRUD + Search / Price Lookup)

**Files:**
- Create: `components/inventory/ProductList.tsx`
- Create: `components/inventory/ProductForm.tsx`
- Create: `app/inventory/page.tsx`
- Test: `tests/integration/inventory.test.tsx`

**Interfaces:**
- Consumes: `Product` type (Task 2), `productSchema`/`ProductInput` (Task 4), `createClient` (Task 2).
- Produces: `ProductList` accepts `{ products: Product[]; onSelect(product: Product): void }`; `ProductForm` accepts `{ initialValues?: Product; onSubmit(values: ProductInput): void }`. The inventory page's own search input is the price-lookup feature — no separate screen.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/integration/inventory.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InventoryPage from "@/app/inventory/page";

const products = [
  { id: "1", name: "MCB 32A", name_hi: null, category: "MCBs", unit: "piece", price: 120, stock_qty: 10, low_stock_threshold: 5, updated_at: "" },
  { id: "2", name: "Copper Wire 1.5mm", name_hi: "तांबे का तार", category: "Wires", unit: "meter", price: 15, stock_qty: 200, low_stock_threshold: 20, updated_at: "" },
];

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({ select: () => Promise.resolve({ data: products, error: null }) }),
  }),
}));

describe("InventoryPage", () => {
  it("filters the product list by search text", async () => {
    render(<InventoryPage />);
    expect(await screen.findByText("MCB 32A")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "copper" } });
    expect(screen.queryByText("MCB 32A")).not.toBeInTheDocument();
    expect(screen.getByText("Copper Wire 1.5mm")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- inventory`
Expected: FAIL

- [ ] **Step 3: Implement `ProductList`, `ProductForm`, and `app/inventory/page.tsx`**

The page fetches products via `createClient().from("products").select()` on mount, holds a search string in state, and filters client-side by case-insensitive substring match against `name` and `name_hi` (treating `null` `name_hi` as never matching — don't throw). Add/edit opens `ProductForm` in a shadcn `Dialog`; submit calls `.insert()`/`.update()` on the `products` table and refetches.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- inventory`
Expected: PASS

- [ ] **Step 5: Manual verification in browser**

Start the dev server, open `/inventory`, confirm add/edit/delete and search all work against the live Supabase project (once Prerequisites are set up).

- [ ] **Step 6: Commit**

```bash
git add components/inventory/ app/inventory/ tests/integration/inventory.test.tsx
git commit -m "feat: add inventory CRUD and search/price-lookup"
```

---

### Task 7: Dashboard Feature

**Files:**
- Create: `components/dashboard/LowStockAlert.tsx`
- Create: `app/dashboard/page.tsx`
- Test: `tests/integration/dashboard.test.tsx`

**Interfaces:**
- Consumes: `Product`/`Customer`/`LedgerEntry` types (Task 2), `calculateBalance` (Task 3), `createClient` (Task 2).
- Produces: `LowStockAlert` accepts `{ products: Product[] }` and renders only products where `low_stock_threshold !== null && stock_qty <= low_stock_threshold`.

- [ ] **Step 1: Write the failing tests**

```tsx
// tests/integration/dashboard.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LowStockAlert } from "@/components/dashboard/LowStockAlert";

const base = { id: "1", name_hi: null, category: "MCBs", unit: "piece", updated_at: "" };

describe("LowStockAlert", () => {
  it("flags a product at or below its threshold", () => {
    render(<LowStockAlert products={[{ ...base, name: "MCB 32A", price: 120, stock_qty: 3, low_stock_threshold: 5 }]} />);
    expect(screen.getByText("MCB 32A")).toBeInTheDocument();
  });

  it("does not flag or crash on a product with no threshold set", () => {
    render(<LowStockAlert products={[{ ...base, name: "Spare Fuse", price: 10, stock_qty: 1, low_stock_threshold: null }]} />);
    expect(screen.queryByText("Spare Fuse")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test -- dashboard`
Expected: FAIL

- [ ] **Step 3: Implement `LowStockAlert` and `app/dashboard/page.tsx`**

Dashboard page fetches products and customers+ledger_entries, passes products to `LowStockAlert`, and shows a count of customers whose `calculateBalance(entries)` is `> 0`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test -- dashboard`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/ app/dashboard/ tests/integration/dashboard.test.tsx
git commit -m "feat: add dashboard with low-stock alerts and outstanding-balance count"
```

---

### Task 8: Ledger Feature

**Files:**
- Create: `components/ledger/CustomerList.tsx`
- Create: `components/ledger/LedgerEntryForm.tsx`
- Create: `app/ledger/page.tsx`
- Create: `app/ledger/[customerId]/page.tsx`
- Test: `tests/integration/ledger.test.tsx`

**Interfaces:**
- Consumes: `Customer`/`LedgerEntry` types (Task 2), `calculateBalance` (Task 3), `ledgerEntrySchema`/`LedgerEntryInput` (Task 4), `createClient` (Task 2).
- Produces: `CustomerList` accepts `{ customers: Customer[]; balances: Record<string, number>; onSelect(customerId: string): void }`; `LedgerEntryForm` accepts `{ customerId: string; onSubmit(values: LedgerEntryInput): void }`.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/integration/ledger.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CustomerList } from "@/components/ledger/CustomerList";

describe("CustomerList", () => {
  it("shows each customer's derived balance", () => {
    render(
      <CustomerList
        customers={[{ id: "c1", name: "Ramesh", phone: null, created_at: "" }]}
        balances={{ c1: 300 }}
        onSelect={() => {}}
      />
    );
    expect(screen.getByText("Ramesh")).toBeInTheDocument();
    expect(screen.getByText(/300/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- ledger`
Expected: FAIL

- [ ] **Step 3: Implement `CustomerList`, `LedgerEntryForm`, `app/ledger/page.tsx`, and `app/ledger/[customerId]/page.tsx`**

The ledger list page fetches all customers and all ledger_entries, groups entries by `customer_id`, runs each group through `calculateBalance`, and passes the result map to `CustomerList`. The customer detail page fetches that customer's entries (ordered by `created_at` desc) and renders `LedgerEntryForm`; submit inserts a row into `ledger_entries` and refetches.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- ledger`
Expected: PASS

- [ ] **Step 5: Manual verification in browser**

Start the dev server, open `/ledger`, add a credit and a payment for a test customer, confirm the balance updates correctly.

- [ ] **Step 6: Commit**

```bash
git add components/ledger/ app/ledger/ tests/integration/ledger.test.tsx
git commit -m "feat: add customer credit ledger"
```

---

### Task 9: Internationalization (English / Hindi Toggle)

**Files:**
- Create: `messages/en.json`, `messages/hi.json`
- Create: `components/layout/LanguageToggle.tsx`
- Create: `app/settings/page.tsx`
- Modify: `app/layout.tsx` (wrap with `next-intl`'s provider)
- Test: `tests/integration/language-toggle.test.tsx`

**Interfaces:**
- Produces: `LanguageToggle` accepts no props; reads/writes the selected locale (`"en" | "hi"`) to `localStorage` under key `"anand-electricals-locale"` and triggers a re-render of translated text.

- [ ] **Step 1: Write the failing test**

```tsx
// tests/integration/language-toggle.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageToggle } from "@/components/layout/LanguageToggle";

describe("LanguageToggle", () => {
  it("switches displayed language from English to Hindi", () => {
    render(<LanguageToggle />);
    expect(screen.getByText(/english/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /hindi/i }));
    expect(screen.getByText(/हिन्दी|hindi/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- language-toggle`
Expected: FAIL

- [ ] **Step 3: Install `next-intl`; write `messages/en.json` and `messages/hi.json`** covering navigation labels, form labels, and button text used in Tasks 5–8.

- [ ] **Step 4: Implement `LanguageToggle`, wire `next-intl`'s provider into `app/layout.tsx`, and add `app/settings/page.tsx`** (language toggle + a logout button calling `createClient().auth.signOut()`).

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- language-toggle`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add messages/ components/layout/LanguageToggle.tsx app/settings/ app/layout.tsx tests/integration/language-toggle.test.tsx
git commit -m "feat: add English/Hindi language toggle and settings page"
```

---

### Task 10: Branding & Visual Polish

**Files:**
- Modify: `tailwind.config.ts` (electric-blue/amber color tokens, dark mode)
- Create: `public/logo.svg` (lightning-bolt mark + "Anand Electricals" wordmark)
- Modify: `app/layout.tsx` (apply chosen font pairing, header with logo/wordmark)
- Modify: `components/dashboard/LowStockAlert.tsx` (Framer Motion entrance/badge animation)
- Modify: `components/ledger/LedgerEntryForm.tsx` (Framer Motion confirm animation on successful submit)

**Interfaces:**
- Consumes: components from Tasks 6–8 (visual-only modification, no prop/behavior changes — existing tests from those tasks must still pass).

- [ ] **Step 1: Define the color palette and typography**

Using the `frontend-design` skill, pick concrete hex values for the electric-blue/amber palette (light + dark mode) and a font pairing; add them as Tailwind theme tokens in `tailwind.config.ts`.

- [ ] **Step 2: Create `public/logo.svg`** (lightning-bolt icon + wordmark, using the chosen palette).

- [ ] **Step 3: Apply branding to the shared layout**

Add a header to `app/layout.tsx` showing the logo/wordmark; apply the chosen fonts globally.

- [ ] **Step 4: Add purposeful Framer Motion animations**

Install `framer-motion`. Add an entrance/pulse animation to low-stock badges in `LowStockAlert`, and a confirm animation (e.g. a brief checkmark/scale) on successful ledger entry submission in `LedgerEntryForm`.

- [ ] **Step 5: Re-run the full test suite to confirm no regressions**

Run: `npm run test`
Expected: PASS (all prior tests still pass — this task changes markup/styling, not component contracts)

- [ ] **Step 6: Manual verification in browser**

Start the dev server, view the Dashboard, Inventory, and Ledger screens in both light and dark mode; confirm the branding reads as intentional, not a generic template, and animations feel purposeful rather than distracting.

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.ts public/logo.svg app/layout.tsx components/dashboard/LowStockAlert.tsx components/ledger/LedgerEntryForm.tsx
git commit -m "feat: apply Anand Electricals branding and purposeful animation"
```

---

### Task 11: PWA Configuration

**Files:**
- Create: `app/manifest.ts`
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` (generated from `public/logo.svg`)
- Modify: `next.config.ts` (wrap with `@ducanh2912/next-pwa`)

**Interfaces:**
- Consumes: `public/logo.svg` (Task 10) as the source for generated icons.

- [ ] **Step 1: Install `@ducanh2912/next-pwa`** and wrap the Next.js config to generate a service worker that caches the app shell and static assets (`runtimeCaching` for Supabase reads is explicitly out of scope per Global Constraints — no offline write queue/sync).

- [ ] **Step 2: Generate `icon-192.png` and `icon-512.png`** from `public/logo.svg` (e.g. via `sharp` or an online/CLI SVG-to-PNG tool), matching the branding from Task 10.

- [ ] **Step 3: Implement `app/manifest.ts`**

Returns a `MetadataRoute.Manifest` with `name: "Anand Electricals"`, `short_name: "Anand Electricals"`, `start_url: "/dashboard"`, `display: "standalone"`, `theme_color` and `background_color` matching the Task 10 palette, and both icon sizes.

- [ ] **Step 4: Build and manually verify installability**

Run `npm run build && npm run start`. In a desktop browser, confirm the install prompt/manifest is recognized (e.g. via the browser's "Install app" affordance or DevTools Application panel). On a phone, confirm "Add to Home Screen" produces the correct icon and name.

- [ ] **Step 5: Commit**

```bash
git add app/manifest.ts public/icons/ next.config.ts
git commit -m "feat: configure PWA manifest and service worker"
```

---

## Deployment (human partner, after Task 11)

Not a plan task — requires account actions an agent cannot perform:
1. Push the repo to a GitHub repository under the human partner's account.
2. Create a Vercel project from that repository (free tier).
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project's environment variables.
4. Confirm the deployed URL loads, and install it as a PWA on dad's phone.
