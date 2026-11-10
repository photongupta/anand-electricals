-- Anand Electricals v1 schema: products, customers, ledger_entries.
-- See docs/superpowers/specs/2026-11-10-anand-electricals-pwa-design.md (Data Model).

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_hi text,
  category text not null,
  unit text not null,
  price numeric not null,
  stock_qty numeric not null,
  low_stock_threshold numeric,
  updated_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  type text not null check (type in ('credit', 'payment')),
  amount numeric not null,
  note text,
  created_at timestamptz not null default now()
);

create view customer_balances as
  select
    customer_id,
    sum(case when type = 'credit' then amount else -amount end) as balance
  from ledger_entries
  group by customer_id;

alter table products enable row level security;
alter table customers enable row level security;
alter table ledger_entries enable row level security;

create policy "authenticated full access" on products
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on customers
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on ledger_entries
  for all to authenticated using (true) with check (true);
