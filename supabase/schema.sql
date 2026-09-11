-- FolicFree — Supabase schema (Sections 3, 3.9, 10)
-- Static-first: food composition data bundled as a static asset; Supabase holds
-- what grows over time. RLS on every table. No users table, no auth.uid().

create extension if not exists "pgcrypto";

-- ---------- foods ----------
create table if not exists foods (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null check (category in ('base','protein','veg','sauce','extra')),
  jurisdiction text not null default 'UK',
  per_100g_kcal numeric not null,
  per_100g_protein numeric not null,
  per_100g_carbs numeric not null,
  per_100g_fat numeric not null,
  per_100g_fibre numeric not null,
  per_100g_folate_mcg numeric not null, -- NATURAL folate only (CoFID)
  folic_acid_status text not null check (folic_acid_status in ('confirmed_clean','confirmed_added','needs_review')),
  source_note text,
  standard_portion_g numeric,
  standard_portion_label text,
  cost_per_100g_gbp numeric, -- computed: recency-weighted verified submissions (60d), cold-start scrape fallback
  wholemeal_or_unfortified_alt_id uuid references foods(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- brands ----------
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  brand_name text not null,
  product_line text not null,
  category text not null,
  jurisdiction text not null default 'UK',
  verification_status text not null check (verification_status in ('confirmed_clean','needs_review','rejected')),
  source_note text,
  where_to_buy_url text,
  sponsored_tier text not null default 'none' check (sponsored_tier in ('none','featured','native_suggestion')),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Firewall rule (Section 3.8) enforced in the database as well as app logic:
alter table brands add constraint sponsored_requires_clean
  check (sponsored_tier = 'none' or verification_status = 'confirmed_clean');

-- ---------- submissions (anonymous food/brand) ----------
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('food','brand')),
  submitted_name text not null check (char_length(submitted_name) between 2 and 120),
  claimed_category text check (claimed_category in ('base','protein','veg','sauce','extra')),
  claimed_folic_acid_status text check (claimed_folic_acid_status in ('confirmed_clean','confirmed_added','needs_review')),
  source_link_or_note text check (char_length(source_link_or_note) <= 500),
  barcode text check (barcode ~ '^(\d{8}|\d{12,14})$'),
  optional_contact text, -- never required
  ai_verdict text check (ai_verdict in ('auto_reject','spot_check','needs_review')),
  ai_reasoning text,
  submission_status text not null default 'pending_review' check (submission_status in ('pending_review','verified','rejected')),
  created_at timestamptz not null default now()
);

-- ---------- price_submissions ----------
create table if not exists price_submissions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid references foods(id),
  retailer text not null check (retailer in ('Tesco','ASDA','Sainsbury''s','Other')),
  price_gbp numeric not null check (price_gbp > 0 and price_gbp <= 1000),
  pack_size_g numeric not null check (pack_size_g >= 1 and pack_size_g <= 50000),
  submitted_at timestamptz not null default now(),
  source text not null default 'user_submitted' check (source in ('scraped','user_submitted')),
  submission_status text not null default 'pending_review' check (submission_status in ('pending_review','verified','rejected')),
  ai_verdict text check (ai_verdict in ('auto_reject','spot_check','needs_review')),
  ai_reasoning text
);

-- ---------- scan_logs (anonymous, captures every barcode scan for data quality) ----------
create table if not exists scan_logs (
  id uuid primary key default gen_random_uuid(),
  ean text not null,
  found boolean not null default false,
  food_slug text,
  folic_acid_status text check (folic_acid_status in ('confirmed_clean','confirmed_added','needs_review')),
  off_name text,
  off_brands text,
  user_agent text,
  created_at timestamptz not null default now()
);

-- Length caps mirror the API validators so a direct anon INSERT can't store
-- anything the API would have rejected.
alter table scan_logs add constraint scan_logs_ean_format check (ean ~ '^\d{6,14}$');
alter table scan_logs add constraint scan_logs_off_name_len check (off_name is null or char_length(off_name) <= 300);
alter table scan_logs add constraint scan_logs_off_brands_len check (off_brands is null or char_length(off_brands) <= 300);
alter table scan_logs add constraint scan_logs_slug_len check (food_slug is null or char_length(food_slug) <= 120);

-- ---------- Row Level Security (Section 3.9) ----------
alter table foods enable row level security;
alter table brands enable row level security;
alter table submissions enable row level security;
alter table price_submissions enable row level security;
alter table scan_logs enable row level security;

create policy "public select foods" on foods for select using (true);
create policy "public select brands" on brands for select using (true);

-- Anonymous INSERT-only on queues: no SELECT, no UPDATE, no DELETE
create policy "anon insert submissions" on submissions for insert to anon with check (true);
create policy "anon insert prices" on price_submissions for insert to anon with check (true);
create policy "anon insert scan_logs" on scan_logs for insert to anon with check (true);

-- All other writes via service_role only (no policies granted to anon/authenticated).

-- ---------- cost refresh (Section 3.6) ----------
-- cost_per_100g_gbp = recency-weighted average of verified submissions from the
-- last 60 days, falling back to the cold-start scrape value. Run periodically.
create or replace function refresh_food_costs() returns void as $$
begin
  update foods f set cost_per_100g_gbp = coalesce((
    select avg(p.price_gbp / p.pack_size_g * 100) -- recency weighting applied app-side
    from price_submissions p
    where p.food_id = f.id
      and p.submission_status = 'verified'
      and p.submitted_at > now() - interval '60 days'
  ), f.cost_per_100g_gbp);
end;
$$ language plpgsql;

