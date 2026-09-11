"use client";

import { useEffect, useMemo, useState } from "react";
import { getFood, type Food } from "@/data/foods";
import { aggregate, badgeMeta, gbp, type MealState } from "@/lib/nutrition";
import { encodeMeal } from "@/lib/share";
import { seedBySlug } from "@/lib/catalog";
import VisualPicker from "@/components/VisualPicker";
import SummaryPanel from "@/components/SummaryPanel";
import VisualCarousel from "@/components/VisualCarousel";

// Meal builder (Section 6.1) — base → protein → veg (+ extras), live nutrition
// and cost panels, primary folic-acid badge.

export default function BuildPage() {
  const [meal, setMeal] = useState<MealState>({ base: "wholemeal-bread", protein: "chicken-breast", veg: ["broccoli"], extra: [], portions: 1, units: "metric" });
  const [catalogList, setCatalogList] = useState<Food[]>([...seedBySlug.values()]);
  const [copied, setCopied] = useState(false);

  // Static seed renders instantly; the Supabase overlay (verified statuses,
  // community costs) replaces it when available.
  useEffect(() => {
    fetch("/api/foods")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.foods?.length) setCatalogList(d.foods as Food[]); })
      .catch(() => {});
  }, []);

  const catalog = useMemo(() => new Map(catalogList.map((f) => [f.slug, f])), [catalogList]);
  const agg = useMemo(() => aggregate(meal, catalog), [meal, catalog]);
  const shareCode = useMemo(() => encodeMeal(meal), [meal]);
  const badge = badgeMeta[agg.badge];

  // Handoff: a food page's "Add to a meal" stores the slug and navigates here;
  // apply it to the right slot based on the food's category.
  useEffect(() => {
    const slug = localStorage.getItem("ff_meal_add");
    if (!slug) return;
    localStorage.removeItem("ff_meal_add");
    const f = getFood(slug);
    if (!f) return;
    setMeal((m) => {
      if (f.category === "base") return { ...m, base: f.slug };
      if (f.category === "protein") return { ...m, protein: f.slug };
      if (f.category === "veg") return m.veg.includes(f.slug) ? m : { ...m, veg: [...m.veg, f.slug].slice(-2) };
      return m.extra.includes(f.slug) ? m : { ...m, extra: [...m.extra, f.slug].slice(-2) };
    });
  }, []);

  const weight = (g: number) => (meal.units === "metric" ? `${Math.round(g)}g` : `${(g / 28.35).toFixed(1)} oz`);

  // Remove a food from whichever slot it occupies (base/protein/veg/extra).
  function removeItem(slug: string) {
    setMeal((m) => ({
      ...m,
      base: m.base === slug ? undefined : m.base,
      protein: m.protein === slug ? undefined : m.protein,
      veg: (m.veg ?? []).filter((s) => s !== slug),
      extra: (m.extra ?? []).filter((s) => s !== slug),
    }));
  }

  async function share() {
    const url = `${location.origin}/share?m=${shareCode}`;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { location.href = url; }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="text-center">
        <h1 className="display text-4xl">Meal builder</h1>
        <button onClick={() => setMeal((m) => ({ ...m, units: m.units === "metric" ? "imperial" : "metric" }))} className="btn-ghost mt-3 !px-4 !py-2 text-sm">
          {meal.units === "metric" ? "Metric" : "Imperial"} ⇄
        </button>
      </div>

      <div className="mt-6 space-y-6">
          <section className="card min-w-0 p-4">
            <h2 className="mb-3 font-display text-lg">1 · Base</h2>
            <VisualPicker cat="base" items={catalogList} selected={[meal.base ?? ""]} />
          </section>
          <section className="card min-w-0 p-4">
            <h2 className="mb-3 font-display text-lg">2 · Protein</h2>
            <VisualPicker cat="protein" items={catalogList} selected={[meal.protein ?? ""]} />
          </section>
          <section className="card min-w-0 p-4">
            <h2 className="mb-3 font-display text-lg">3 · Veg <span className="text-sm font-normal text-stone-500">(up to two)</span></h2>
            <VisualPicker cat="veg" items={catalogList} selected={meal.veg} />
          </section>
          <section className="card min-w-0 p-4">
            <h2 className="mb-3 font-display text-lg">4 · Extras <span className="text-sm font-normal text-stone-500">(fruit, optional)</span></h2>
            <VisualPicker cat="extra" items={catalogList} selected={meal.extra} />
          </section>

          {/* Clean-products showcase (genesis) — the entire catalog of unfortified
              foods, image-first. The Comparison Cross now lives on the fortified
              products' own pages, where it answers people who are actively asking about them. */}
          <VisualCarousel
            heading="Other unfortified foods to try"
            sub="Every item offered here is flagged free of added folic acid — build with these, not against fortification."
            items={catalogList.filter((f) => f.fa === "clean")}
          />

          {/* Results box — full width, stacked below the pickers */}
          <SummaryPanel agg={agg} badge={badge} meal={meal} shareCode={shareCode} share={share} copied={copied} weight={weight} setMeal={setMeal} remove={removeItem} />
      </div>
    </main>
  );
}
