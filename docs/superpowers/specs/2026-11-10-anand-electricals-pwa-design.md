# Anand Electricals PWA — v1 Design Spec

Date: 2026-11-10

## Context & Intent

The user's goal is to build hands-on experience with agentic systems built on
LLMs (building them, and testing them predictably), after only having
theoretical understanding. Rather than a toy exercise, they're using a real
project with a real stakeholder: their dad's electrical shop (Anand
Electricals) in a small town.

The long-term goal is a PWA dad actually uses day to day. The near-term goal
(this spec) is a solid, owner-facing data app — inventory, customer credit
ledger, price lookup — with no LLM/agent feature yet. The deliberate v2 (not
in this spec) is an agent layered on top of this same data: e.g. uploading a
photo of a purchase bill and having an agent OCR/parse it and update stock
accordingly. v1 exists partly to produce the clean, agent-writable data model
that v2 needs.

### Decisions already made (do not re-litigate during planning)

- **v1 scope is owner/staff-facing only.** No customer-facing catalog/ordering
  in this phase — that would be a separate subsystem and a separate spec.
- **Single login for dad.** No multi-staff accounts in v1.
- **Cloud backend on free tiers** (Supabase + Vercel), not local-only storage,
  so data survives device loss and v2's agent has a backend to extend.
- **No LLM/agent feature in v1.** v1 is the plain CRUD app.
- **No invoicing/sales-order table in v1.** Stock is adjusted directly on the
  product record; a sales/transaction log is an explicit future "v1.1", not
  required to solve the three chosen pain points (stock tracking, udhaar
  ledger, price lookup).
- **English + Hindi toggle** in the UI.
- **Modern, stylish, animated look**, with shop branding ("Anand
  Electricals") reflected in the visual design.

## Architecture

**Stack:**
- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Backend/data:** Supabase (free tier) — Postgres database + Supabase Auth
  (email/password, single account for dad)
- **PWA:** `@ducanh2912/next-pwa` (or equivalent) for service worker + home
  screen installability + offline caching of the app shell and
  last-fetched data
- **i18n:** `next-intl` (or `react-i18next`) for the English/Hindi toggle,
  with the chosen language persisted in local storage
- **UI components:** shadcn/ui (Tailwind + Radix primitives)
- **Animation:** Framer Motion, used purposefully (state-change feedback,
  navigation transitions) rather than decoratively
- **Hosting:** Vercel free tier (frontend + future API routes), Supabase
  free tier (Postgres + Auth)

**High-level shape:**

```
Next.js app (Vercel)
 ├─ UI pages (App Router): Dashboard, Inventory, Ledger, Settings
 ├─ Supabase client (browser) for reads/writes, gated by Supabase Auth session
 └─ /api routes reserved, unused in v1 (future home for the v2 agent backend)
Supabase (hosted)
 ├─ Postgres tables: products, customers, ledger_entries
 └─ Auth: single user (dad)
```

Data lives in Supabase so it's reachable from any device and durable if a
phone is lost. The service worker caches the app shell and last-fetched data
so the app still opens and shows the last known stock/ledger state offline,
but writes require connectivity — there is no offline write queue/sync in
v1; that is meaningful added complexity not justified by the shop's
day-to-day connectivity.

## Data Model

**`products`** — serves both inventory tracking and price lookup (one
table, no separate "price list" — price lookup is just a search over this
table surfaced prominently in the UI).

| column               | type        | notes                                   |
|----------------------|-------------|------------------------------------------|
| id                   | uuid, pk    |                                           |
| name                 | text        | e.g. "MCB 32A"                           |
| name_hi              | text, null  | Hindi name, used when Hindi is selected  |
| category             | text        | free-text, e.g. "Switches", "Wires"      |
| unit                 | text        | e.g. "piece", "meter", "box"              |
| price                | numeric     |                                           |
| stock_qty            | numeric     |                                           |
| low_stock_threshold  | numeric, null | drives dashboard "running low" alerts  |
| updated_at           | timestamptz |                                           |

**`customers`** — for the udhaar (credit) ledger.

| column     | type        | notes |
|------------|-------------|-------|
| id         | uuid, pk    |       |
| name       | text        |       |
| phone      | text, null  |       |
| created_at | timestamptz |       |

**`ledger_entries`** — every credit given or payment received, per customer.
A customer's current balance is **derived** (sum of `credit` − sum of
`payment`), computed on read via a SQL view, rather than stored — so it
can never drift out of sync with its history.

| column      | type                        | notes                         |
|-------------|------------------------------|--------------------------------|
| id          | uuid, pk                    |                                 |
| customer_id | fk → customers              |                                 |
| type        | enum: `credit` \| `payment`  | credit = owes more, payment = paid back |
| amount      | numeric                     |                                 |
| note        | text, null                  | e.g. "2 bulbs + wire", "paid cash" |
| created_at  | timestamptz                 |                                 |

This schema is intentionally the shape a future agent can write into
directly (e.g. inserting `ledger_entries` rows or updating `stock_qty` after
parsing an uploaded bill) without a schema migration — but that integration
itself is out of scope for this spec.

## Features (Screens)

1. **Login** — Supabase email/password, single account for dad.
2. **Dashboard** — low-stock alerts (products at/under `low_stock_threshold`),
   count of customers with an outstanding balance, quick links to the other
   screens.
3. **Inventory** — searchable/filterable product list (search across `name`
   and `name_hi`), add/edit/delete a product, inline stock & price edit.
   This same search box **is** the price-lookup feature — no separate screen.
4. **Ledger** — customer list showing each one's derived running balance;
   tapping a customer shows their full credit/payment history and a form to
   add a new `credit` or `payment` entry.
5. **Settings** — language toggle (English/Hindi), logout.

## Visual Design & Branding

- **Identity:** "Anand Electricals" wordmark in the header/login screen; a
  stylized lightning-bolt icon mark, also used as the PWA app icon/favicon
  (so the home-screen icon looks intentional, not a generic placeholder).
- **Palette:** electric blue as primary, warm amber/gold as accent — evokes
  both "electrical" and the warmth/prosperity association of "Anand". Dark
  mode supported (useful under harsh counter lighting either way).
- **Typography:** a clean modern sans-serif for body text, a bolder display
  face for headings/wordmark; sizing generous for fast legibility at a shop
  counter.
- Exact hex values, the specific font pairing, and the actual SVG icon are
  deliberately **not** pinned in this spec — they get decided concretely
  during implementation using the `frontend-design` skill, so the result is
  an intentional choice rather than default Tailwind grays.

## Testing Approach

- **Unit tests (Vitest):** balance-calculation logic (derived ledger
  balance), form validation.
- **Integration tests (React Testing Library):** Inventory and Ledger flows,
  against a local/mocked Supabase client.
- **Manual pass on a real phone:** install as a PWA, verify the offline app
  shell loads, verify core flows (add product, adjust stock, add ledger
  entry) before calling v1 done.
- No e2e framework (Playwright etc.) in v1 — disproportionate infra for a
  5-screen app at this stage.

## Deployment

- Supabase project (free tier): Postgres + Auth.
- Vercel project (free tier) connected to a GitHub repo, auto-deploys on
  push to `main`.
- Env vars (Supabase URL/anon key) set in the Vercel dashboard, never
  committed to the repo.

## Explicitly Out of Scope (v1)

- Customer-facing catalog/ordering.
- Multi-staff accounts/permissions.
- Invoicing/sales-order/transaction log (stock is edited directly; a
  transaction log is a possible v1.1).
- Any LLM/agent feature (bill-upload stock update, chat assistant, etc.) —
  deliberate v2, built on top of this data model.
- Offline write queue/sync.
- E2E test automation.
