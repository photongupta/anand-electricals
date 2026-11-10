# Anand Electricals

Owner-facing PWA for Anand Electricals: inventory/stock tracking, a customer
credit (udhaar) ledger, and price lookup. See
[docs/superpowers/specs/2026-11-10-anand-electricals-pwa-design.md](docs/superpowers/specs/2026-11-10-anand-electricals-pwa-design.md)
for the full design.

## Getting started

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` and fill in your Supabase project's URL
and anon key. Apply `supabase/migrations/0001_init.sql` to that project
before using the app.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build (uses `--webpack`; `@ducanh2912/next-pwa`
  only hooks the webpack config, not Turbopack)
- `npm run test` — run the test suite
- `npm run lint` — lint
