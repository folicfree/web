"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Food } from "@/data/foods";
import { foodEmoji } from "@/data/emoji";
import { seedBySlug } from "@/lib/catalog";
import { getList, LIST_EVENT, setList } from "@/lib/shopping";
import { gbp, portionCost } from "@/lib/nutrition";

// Shopping list — localStorage only; exports to a stateless PDF.
export default function ListPage() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Map<string, Food>>(new Map(seedBySlug));

  useEffect(() => {
    setSlugs(getList());
    const sync = () => setSlugs(getList());
    window.addEventListener(LIST_EVENT, sync);
    fetch("/api/foods").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d?.foods?.length) setCatalog(new Map((d.foods as Food[]).map((f) => [f.slug, f])));
    }).catch(() => {});
    return () => window.removeEventListener(LIST_EVENT, sync);
  }, []);

  const items = slugs.map((s) => catalog.get(s)).filter((f): f is Food => Boolean(f));
  const total = items.reduce((t, f) => t + (f.packPrice ?? portionCost(f)), 0);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="text-center">
        <h1 className="display text-4xl">Shopping list</h1>
        <p className="mt-2 text-sm text-stone-500">{items.length} item{items.length === 1 ? "" : "s"}</p>
      </div>

      {items.length === 0 ? (
        <div className="card mt-8 p-10 text-center">
          <p className="text-4xl" aria-hidden>🧺</p>
          <p className="mt-4 font-medium">Your list is empty.</p>
          <p className="mt-1 text-sm text-stone-500">Tap the basket icon on any product card to add it here.</p>
          <Link href="/" className="btn-primary mt-6 inline-flex">Browse clean foods</Link>
        </div>
      ) : (
        <>
          <div className="card mt-8 divide-y divide-stone-100 overflow-hidden">
            {items.map((f) => (
              <div key={f.slug} className="flex items-center gap-4 p-4">
                <Link href={`/food/${f.slug}`} className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                  {f.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl" aria-hidden>{foodEmoji(f)}</span>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/food/${f.slug}`} className="block truncate text-sm font-medium hover:text-emerald-700">{f.name}</Link>
                  <p className="text-xs text-stone-500">
                    {f.packG && f.packPrice ? `${f.packG}g pack` : f.portionLabel}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">{f.packPrice ? `£${f.packPrice.toFixed(2)}` : gbp(portionCost(f))}</span>
                <button
                  onClick={() => setList(slugs.filter((s) => s !== f.slug))}
                  aria-label={`Remove ${f.name}`}
                  className="shrink-0 rounded-full px-2 py-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
                >✕</button>
              </div>
            ))}
          </div>

          <div className="card mt-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500">Estimated total</p>
              <p className="display text-3xl text-emerald-700">£{total.toFixed(2)}</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <a href={`/api/shopping-pdf?s=${slugs.join(",")}`} className="btn-primary btn-mobile-full">Download PDF</a>
              <button onClick={() => setList([])} className="btn-ghost btn-mobile-full">Clear all</button>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-stone-500">
            Every item is flagged free of added folic acid. Prices are community estimates —
            pack prices shown where known.
          </p>
        </>
      )}
    </main>
  );
}