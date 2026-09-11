"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Food, FoodCategory } from "@/data/foods";
import { foodEmoji } from "@/data/emoji";
import { badgeMeta, faBadgeText, gbp, portionCost } from "@/lib/nutrition";
import { useDragScroll } from "@/lib/useDragScroll";
import ShoppingButton from "@/components/ShoppingButton";
import AddToMealButton from "@/components/AddToMealButton";

// Visual-first picker for the meal builder: cards carousel (photo/emoji, name,
// pack price, badge) with search narrowing, selected ring, and an expandable
// full grid for power users.

export default function VisualPicker({
  cat, items, selected,
}: { cat: FoodCategory; items: Food[]; selected: string[] }) {
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const drag = useDragScroll(track);
  // Omission rule: foods confirmed to contain added folic acid are never offered.
  const catItems = items.filter((f) => f.category === cat && f.fa !== "added");
  const filtered = catItems.filter((f) => f.name.toLowerCase().includes(q.trim().toLowerCase()));

  const card = (f: Food, inGrid: boolean) => {
    const on = selected.includes(f.slug);
    return (
      <Link
        key={f.slug}
        href={`/food/${f.slug}`}
        draggable={false}
        className={`${inGrid ? "w-full" : "snap-start"} relative block overflow-hidden rounded-xl border bg-white text-left transition ${
          on ? "border-emerald-600 ring-2 ring-emerald-600/30" : "border-stone-200 hover:border-stone-400"
        }`}
      >
        <div className={`relative flex ${inGrid ? "h-28" : "h-24"} items-center justify-center overflow-hidden bg-stone-50`}>
          <ShoppingButton slug={f.slug} />
          {f.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.image} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl" aria-hidden>{foodEmoji(f)}</span>
          )}
        </div>
        <div className="p-2.5">
          <div className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${badgeMeta[f.fa].dot}`} />
            <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-stone-400">{faBadgeText[f.fa]}</span>
          </div>
          <p className="mt-0.5 line-clamp-2 min-h-8 text-xs font-medium leading-snug">{f.name}</p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            {f.packG && f.packPrice ? `£${f.packPrice.toFixed(2)} · ${f.packG}g` : gbp(portionCost(f))}
          </p>
          <div className="mt-1.5">
            <AddToMealButton slug={f.slug} compact />
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="min-w-0">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Filter…"
        className="mb-2 w-full rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm outline-none placeholder:text-stone-400 focus:border-emerald-600"
      />

      {showAll ? (
        <div className="grid max-h-80 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
          {filtered.map((f) => card(f, true))}
        </div>
      ) : (
        <div
          ref={track}
          {...drag}
          className="grid w-full auto-cols-[9.5rem] cursor-grab select-none snap-x snap-mandatory grid-flow-col grid-rows-2 gap-2.5 overflow-x-auto pb-2 active:cursor-grabbing md:auto-cols-[10.5rem] md:grid-rows-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {filtered.map((f) => card(f, false))}
          {filtered.length === 0 && <p className="py-8 text-sm text-stone-500">Nothing matches “{q.trim()}”.</p>}
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
        <span>
          {selected.length > 0
            ? `In your meal: ${selected.map((s) => items.find((f) => f.slug === s)?.name).filter(Boolean).join(", ")}`
            : "Tap a product for full nutrition — add it to your meal or list from there."}
        </span>
        <button onClick={() => setShowAll((v) => !v)} className="font-medium text-emerald-700 hover:text-emerald-800">
          {showAll ? "← Back to carousel" : `Browse all ${filtered.length}`}
        </button>
      </div>
    </div>
  );
}
