"use client";

import { useState } from "react";
import type { Food, FoodCategory } from "@/data/foods";
import { badgeMeta, faBadgeText, gbp, portionCost } from "@/lib/nutrition";

export function Badge({ fa }: { fa: "clean" | "added" | "review" }) {
  const m = badgeMeta[fa];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {faBadgeText[fa]}
    </span>
  );
}

export function Picker({
  cat, items, selected, onPick, multi,
}: { cat: FoodCategory; items: Food[]; selected: string[]; onPick: (f: Food) => void; multi?: boolean }) {
  const [q, setQ] = useState("");
  const filtered = items.filter((f) => f.category === cat && f.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Search ${cat === "veg" ? "vegetables" : cat + "s"}…`}
        className="mb-2 w-full rounded-lg border border-stone-200 bg-stone-100 px-3 py-1.5 text-sm outline-none placeholder:text-stone-500 focus:border-emerald-600"
      />
      <div className="grid max-h-72 grid-cols-1 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
        {filtered.map((f) => {
          const on = selected.includes(f.slug);
          return (
            <button
              key={f.slug}
              onClick={() => onPick(f)}
              className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                on ? "border-emerald-600 bg-emerald-100" : "border-stone-200 hover:border-stone-400 hover:bg-stone-100"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate">{f.name}</span>
                <span className="text-[11px] text-stone-500">
                  {f.packG && f.packPrice
                    ? `${f.packG}g pack · £${f.packPrice.toFixed(2)} · ${gbp(portionCost(f))}/portion`
                    : `${f.portionLabel} · ${gbp(portionCost(f))}`}
                </span>
              </span>
              <span className={`h-2 w-2 shrink-0 rounded-full ${badgeMeta[f.fa].dot}`} title={faBadgeText[f.fa]} />
            </button>
          );
        })}
      </div>
      {multi && <p className="mt-1 text-[11px] text-stone-500">Pick up to two.</p>}
    </div>
  );
}
