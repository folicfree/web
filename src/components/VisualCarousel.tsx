"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Food } from "@/data/foods";
import { foodEmoji } from "@/data/emoji";
import { badgeMeta, faBadgeText, gbp, portionCost } from "@/lib/nutrition";
import { useDragScroll } from "@/lib/useDragScroll";
import ShoppingButton from "@/components/ShoppingButton";
import AddToMealButton from "@/components/AddToMealButton";

// Visual-first carousel (Section: instant visual answer). Horizontally
// scrolling snap-cards of foods with NO added folic acid — photos for branded
// products, emoji for generic whole foods. Tap a card → its food page.

export default function VisualCarousel({ items, heading, sub }: { items: Food[]; heading: string; sub?: string }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useDragScroll(track);
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);
  if (items.length === 0) return null;

  const filtered = items.filter((f) => f.name.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <section className="py-4">
      <div className="card card-clean mx-auto max-w-6xl overflow-hidden px-4 py-6">
        <p className="eyebrow text-[color:var(--ink-faint)]">Instant answer</p>
        <h2 className="display mt-2 text-3xl">{heading}</h2>
        {sub && <p className="mt-2 max-w-xl text-sm text-[color:var(--ink-dim)]">{sub}</p>}

        {/* Contained multi-row carousel: 2 rows on mobile, 4 on desktop — swipes horizontally through columns. */}
      <div className="mt-5 -mx-2 overflow-hidden">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search these foods…"
          aria-label="Search these foods"
          className="mx-2 mb-3 w-[calc(100%-1rem)] max-w-md rounded-full border border-stone-200 bg-white px-4 py-2 text-sm outline-none placeholder:text-stone-400 focus:border-emerald-600"
        />
        {showAll ? (
          <div className="grid max-h-[32rem] grid-cols-2 gap-4 overflow-y-auto px-2 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((f) => (
              <Link key={f.slug} href={`/food/${f.slug}`} draggable={false} className="card card-hover group relative  overflow-hidden">
                <div className="relative flex h-32 items-center justify-center overflow-hidden bg-stone-50">
                  <ShoppingButton slug={f.slug} />
                  {f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image} alt={f.name} loading="lazy" draggable={false} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-4xl" aria-hidden>{foodEmoji(f)}</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${badgeMeta[f.fa].dot}`} />
                    <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">{faBadgeText[f.fa]}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 min-h-9 text-sm font-medium leading-snug">{f.name}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {f.packG && f.packPrice ? `£${f.packPrice.toFixed(2)} · ${f.packG}g pack` : gbp(portionCost(f))}
                  </p>
                  <div className="mt-2">
                    <AddToMealButton slug={f.slug} compact />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div
            ref={track}
            {...drag}
            className="grid w-full auto-cols-[10rem] cursor-grab select-none snap-x snap-mandatory grid-flow-col grid-rows-2 gap-4 overflow-x-auto px-2 pb-4 active:cursor-grabbing md:auto-cols-[11rem] md:grid-rows-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {filtered.map((f) => (
              <Link key={f.slug} href={`/food/${f.slug}`} draggable={false} className="card card-hover group relative snap-start overflow-hidden">
                <div className="relative flex h-28 md:h-32 items-center justify-center overflow-hidden bg-stone-50">
                  <ShoppingButton slug={f.slug} />
                  {f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image} alt={f.name} loading="lazy" draggable={false} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                  ) : (
                    <span className="text-4xl" aria-hidden>{foodEmoji(f)}</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${badgeMeta[f.fa].dot}`} />
                    <span className="truncate text-[10px] font-semibold uppercase tracking-wide text-[color:var(--ink-faint)]">{faBadgeText[f.fa]}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 min-h-9 text-sm font-medium leading-snug">{f.name}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {f.packG && f.packPrice ? `£${f.packPrice.toFixed(2)} · ${f.packG}g pack` : gbp(portionCost(f))}
                  </p>
                  <div className="mt-2">
                    <AddToMealButton slug={f.slug} compact />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-1.5 flex items-center justify-between px-2 text-[11px] text-stone-500">
          <span>{filtered.length} of {items.length} shown</span>
          <button onClick={() => setShowAll((v) => !v)} className="font-medium text-emerald-700 hover:text-emerald-800">
            {showAll ? "← Back to carousel" : `Browse all ${filtered.length}`}
          </button>
        </div>
      </div>
</div>
</section>
  );
}
