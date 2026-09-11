# FolicFree.com — MVP (v2 documentation, Section 11)

Premium UK food comparison engine: folic-acid-first meal builder, Comparison
Cross, shareable meals, PDF export, and an anonymous AI-screened submission
pipeline. No accounts, no tracking cookies, nothing server-side persisted.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
```

Build check: `npm run build`.

## What's implemented

- **Meal builder** (`/build`) — base → protein → veg (+ fruit extras), live
  per-portion nutrition + cost panels, meal-level folic-acid badge
  (green/amber/red), metric/imperial toggle, portion scaling, collapsible
  secondary-additive layer.
- **Comparison Cross** — contextual on bread/grain/pasta/cereal bases; lateral
  same-category swaps + vertical "same job, better" options with deltas;
  tap-to-reveal on mobile.
- **Share + OG** — meal state encoded into the URL (`/share?m=…`); OG card via
  `next/og` at `/api/og`; pre-filled X/WhatsApp text; no server persistence.
- **PDF export** — `/api/pdf?m=…` stateless render via `@react-pdf/renderer`.
- **Food pages** (`/food/[slug]`) — statically generated for all ~160 foods with
  schema.org `NutritionInformation` JSON-LD.
- **Brand directory** (`/brands`) — editorial pages, verification badges,
  featured tier (firewalled to verified-clean brands in data + SQL constraint).
- **Submissions** (`/submit`) — anonymous food/brand + price forms →
  `/api/submit`: IP rate limiting (10/hour), validation/sanitisation, then
  `screenSubmission()` → verdict logged to the queue. Nothing auto-publishes.
- **AI abstraction** — `src/lib/ai/screen.ts`: provider is `AI_PROVIDER` config
  (groq → cloudflare → deterministic heuristic fallback). Keys server-only.
- **Secondary layer** (`/also-watch/[slug]`) — subordinate URL path, Bovaer +
  E171 stubs with the join-table pattern proven.
- **Supabase schema** — `supabase/schema.sql`: all v2 tables, RLS on every
  table (SELECT-only public reads; INSERT-only anon queues), sponsored-tier
  firewall as a DB constraint, `refresh_food_costs()` for recency-weighted
  pricing. No users table, no `auth.uid()`.

## Data

154 seed foods with CoFID-derived approximations, natural folate only (added
folic acid tracked via `folic_acid_status`), portion sizes, and cold-start
cost estimates. **Sample data — verify flags against real packaging before
launch.** Brand entries are illustrative placeholders.

## Remaining for production

- **Admin review queue** (`/admin`, token-gated via `ADMIN_TOKEN`): verify/reject
  pending `submissions` and `price_submissions`. Requires Supabase configured.
- **Supabase overlay is wired**: `loadCatalog()` merges `foods` table rows
  (folic_acid_status, cost_per_100g_gbp, source_note) over the seed dataset,
  served to the builder via `/api/foods` and used by `/` and `/food/[slug]`
  with 300s revalidation. Without Supabase, the seed dataset is the catalog.
- **Trust guardrail**: while `SEED_DATA_VERIFIED != true`, seed-derived badges
  show a "pending packaging verification" notice — a verified badge is a
  factual claim and is never faked.
- Cloudflare WAF/bot management in front of all endpoints (deploy-side).
- ASDA cold-start price scrape (separate maintenance script, ToS/robots checked).
## Images

Product photos come from two free, openly-licensed sources, resolved by
`scripts/fetch-images.mjs` (rerunnable; merges into `src/data/food-images.json`):

- **Open Food Facts** (ODbL) — front-pack photos for branded products, matched by name.
- **Wikimedia Commons** (CC-licensed) — fallback for generic whole foods (broccoli, eggs…).

At launch **151/154** foods have a real photo; the remaining few are non-clean
items not shown in the "clean" carousels and fall back to an emoji tile.

**Note for production:** Wikimedia images carry CC attribution requirements.
Before public launch, add an attribution mechanism (e.g. an `imageCredit`
field linked to the Commons file page / openfoodfacts.org page) so the licence
is honoured.
- Dependabot/Renovate on the GitHub repo; Umami for cookie-free analytics.
