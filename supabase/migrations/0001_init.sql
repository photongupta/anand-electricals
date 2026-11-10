-- Anand Electricals v1 schema: products, customers, ledger_entries.
-- See docs/superpowers/specs/2026-11-10-anand-electricals-pwa-design.md (Data Model).

create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  name_hi text,
  category text not null check (length(trim(category)) > 0),
  unit text not null check (length(trim(unit)) > 0),
  price numeric not null check (price > 0),
  stock_qty numeric not null check (stock_qty >= 0),
  low_stock_threshold numeric check (low_stock_threshold >= 0),
  updated_at timestamptz not null default now()
);

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on products
  for each row
  execute function set_updated_at();

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  phone text,
  created_at timestamptz not null default now()
);

create table ledger_entries (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id),
  type text not null check (type in ('credit', 'payment')),
  amount numeric not null check (amount > 0),
  note text,
  created_at timestamptz not null default now()
);

-- security_invoker so this view runs with the querying user's own
-- privileges (and is therefore still gated by the RLS policies below),
-- rather than the view owner's — otherwise it would bypass RLS and
-- financial balances would be readable with the public anon key.
-- The left join + coalesce means a customer with zero entries gets a
-- balance of 0 instead of no row at all.
create view customer_balances
  with (security_invoker = true)
  as
  select
    customers.id as customer_id,
    coalesce(
      sum(case when ledger_entries.type = 'credit' then ledger_entries.amount
               when ledger_entries.type = 'payment' then -ledger_entries.amount
               else 0 end),
      0
    ) as balance
  from customers
  left join ledger_entries on ledger_entries.customer_id = customers.id
  group by customers.id;

alter table products enable row level security;
alter table customers enable row level security;
alter table ledger_entries enable row level security;

create policy "authenticated full access" on products
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on customers
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on ledger_entries
  for all to authenticated using (true) with check (true);
