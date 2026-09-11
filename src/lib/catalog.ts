import { foodsPriced as seedFoods, type Food } from "@/data/foods";
import { fetchFoodsOverlay, supabaseConfigured } from "@/lib/supabase";

// Catalog loader (Section 3.1 static-first + Section 3 moderation):
// seed data ships bundled; Supabase `foods` rows override it per-slug so
// verification updates and community pricing publish without redeploying.
// With Supabase unconfigured, the seed dataset is the catalog.

export interface Catalog {
  foods: Food[];
  bySlug: Map<string, Food>;
  source: "seed" | "seed+supabase";
}

let cache: Catalog | null = null;
let cachedAt = 0;
const TTL_MS = 5 * 60 * 1000;

export async function loadCatalog(): Promise<Catalog> {
  if (cache && Date.now() - cachedAt < TTL_MS) return cache;

  const bySlug = new Map(seedFoods.map((f) => [f.slug, { ...f }]));
  let source: Catalog["source"] = "seed";

  if (supabaseConfigured) {
    const overlay = await fetchFoodsOverlay();
    if (overlay) {
      source = "seed+supabase";
      for (const row of overlay) {
        const slug = typeof row.slug === "string" ? row.slug : null;
        if (!slug) continue;
        const food = bySlug.get(slug);
        if (!food) continue;
        if (typeof row.folic_acid_status === "string" && ["clean", "added", "review"].includes(row.folic_acid_status)) {
          food.fa = row.folic_acid_status as Food["fa"];
        }
        if (typeof row.cost_per_100g_gbp === "number") food.cost = row.cost_per_100g_gbp;
        if (typeof row.source_note === "string" && row.source_note) food.note = row.source_note;
      }
    }
  }

  cache = { foods: [...bySlug.values()], bySlug, source };
  cachedAt = Date.now();
  return cache;
}

// Seed-only helpers for code paths that must stay synchronous (client bundle).
export const seedBySlug = seedFoods.reduce<Map<string, Food>>((m, f) => m.set(f.slug, f), new Map());
