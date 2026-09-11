"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Food } from "@/data/foods";
import { seedBySlug } from "@/lib/catalog";
import { badgeMeta, faBadgeText, gbp, portionCost } from "@/lib/nutrition";

// Instant search (hard rule: value within one action, zero configuration).
// Client-side substring match against the same in-memory catalog the meal
// builder uses. No submit button, no server round trip, no filter steps.

export default function InstantSearch({ autoFocus = false, placeholder = "Search a food or brand — e.g. \u201cbread\u201d, \u201cWeetabix\u201d…" }: { autoFocus?: boolean; placeholder?: string }) {
  const [catalog, setCatalog] = useState<Food[]>([...seedBySlug.values()]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/foods")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.foods?.length) setCatalog(d.foods as Food[]); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return [];
    const starts: Food[] = [], contains: Food[] = [];
    for (const f of catalog) {
      // Omission rule: fortified foods are never offered in results.
      if (f.fa === "added") continue;
      const n = f.name.toLowerCase();
      if (n.startsWith(needle)) starts.push(f);
      else if (n.includes(needle) || (f.slug.includes(needle))) contains.push(f);
    }
    return [...starts, ...contains].slice(0, 8);
  }, [q, catalog]);

  return (
    <div ref={boxRef} className="relative">
      <input
        value={q}
        autoFocus={autoFocus}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && results[0]) { location.href = `/food/${results[0].slug}`; }
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        aria-label="Search foods"
        className="w-full rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none placeholder:text-stone-400 focus:border-emerald-500/50"
      />
      {q.trim().length >= 2 && open && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_24px_60px_-20px_#26251f59]">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-stone-500">No match for &ldquo;{q.trim()}&rdquo; — try a broader term, or submit it so we can add it.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {results.map((f) => (
                <li key={f.slug}>
                  <Link href={`/food/${f.slug}`} className="flex items-center gap-3 px-4 py-3 transition hover:bg-stone-50" onClick={() => setOpen(false)}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-100 text-sm font-semibold text-stone-400">
                      {f.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        f.name.charAt(0)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{f.name}</span>
                      <span className="text-[11px] text-stone-500">
                        {f.packG && f.packPrice ? `${f.packG}g pack · £${f.packPrice.toFixed(2)}` : `${f.portionLabel} · ${gbp(portionCost(f))}`}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${badgeMeta[f.fa].cls}`}>
                      {faBadgeText[f.fa]}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
