"use client";

import { useState } from "react";
import { getCross } from "@/data/foods";
import type { Food } from "@/data/foods";
import { badgeMeta, faBadgeText, gbp, portionCost } from "@/lib/nutrition";

// The Comparison Cross (Section 6.2) — signature interaction.
// Lateral axis = same-category alternatives (search intent people arrive with).
// Vertical axis = categorically different options solving the same job better.
// Mobile: tap-to-reveal deltas instead of hover.

interface Props {
  centerSlug: string;
  catalog: Map<string, Food>;
  onSwap: (slug: string) => void;
}

export default function ComparisonCross({ centerSlug, catalog, onSwap }: Props) {
  const cross = getCross(centerSlug);
  const [active, setActive] = useState<string | null>(null);

  if (!cross) return null;
  const center = catalog.get(cross.center);
  if (!center) return null;

  const delta = (slug: string) => {
    const f = catalog.get(slug);
    if (!f || !center) return null;
    const dCost = f.portionG * f.cost - center.portionG * center.cost;
    const dKcal = (f.portionG * f.kcal - center.portionG * center.kcal) / 100;
    return { food: f, dCost, dKcal };
  };

  const renderCell = (slug: string) => {
    const d = delta(slug);
    if (!d) return null;
    const open = active === slug;
    return (
      <button
        key={slug}
        onClick={() => { onSwap(slug); setActive(null); }}
        onMouseEnter={() => setActive(slug)}
        onMouseLeave={() => setActive((a) => (a === slug ? null : a))}
        className={`group rounded-xl border p-3 text-left transition hover:border-emerald-600 ${open ? "border-emerald-600 bg-stone-100" : "border-stone-200"}`}
      >
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${badgeMeta[d.food.fa].dot}`} />
          <span className="text-sm font-medium">{d.food.name}</span>
        </div>
        {open && (
          <div className="mt-2 space-y-1 text-xs text-stone-600">
            <div className={d.dCost <= 0 ? "text-emerald-700" : "text-amber-700"}>
              {d.dCost <= 0 ? "−" : "+"}{gbp(Math.abs(d.dCost))} per portion
            </div>
            <div>{Math.abs(Math.round(d.dKcal))} kcal {d.dKcal <= 0 ? "less" : "more"}</div>
            <div className="text-stone-500">{faBadgeText[d.food.fa]}</div>
          </div>
        )}
      </button>
    );
  };

  return (
    <section className="card mt-6 p-6">
      <h3 className="font-display text-xl">The comparison cross</h3>
      <p className="mt-1 text-xs text-stone-500">Around <span className="text-stone-700">{center.name}</span> — tap any option to swap it in and see the delta.</p>

      <div className="mt-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-stone-500">↔ Same job, different ingredient</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{cross.lateral.map(renderCell)}</div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-stone-500">↕ Different shelf — only if you&apos;re curious</div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">{cross.vertical.map(renderCell)}</div>
      </div>
    </section>
  );
}
