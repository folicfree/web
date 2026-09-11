import type React from "react";
import type { Aggregates, MealState } from "@/lib/nutrition";
import { badgeMeta } from "@/lib/nutrition";

// Results panel: badge, lines, live nutrition grid, cost, portions, share/export.
// Rendered full-width below the pickers (stacked layout).
function SummaryPanel({
  agg, badge, meal, shareCode, share, copied, weight, setMeal, remove,
}: {
  agg: Aggregates;
  badge: (typeof badgeMeta)["clean"];
  meal: MealState;
  shareCode: string;
  share: () => void;
  copied: boolean;
  weight: (g: number) => string;
  setMeal: React.Dispatch<React.SetStateAction<MealState>>;
  remove: (slug: string) => void;
}) {
  return (
    <aside className="space-y-4">
      <div className="card grid gap-6 p-6 sm:grid-cols-[1fr_1fr]">
        <div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}>
          <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
        <div className="mt-4 space-y-1.5 text-sm">
          {agg.lines.map((l) => (
            <div key={l.food.slug} className="group flex items-center justify-between gap-2">
              <span className="truncate text-stone-700">{l.food.name}</span>
              <span className="flex shrink-0 items-center gap-1.5">
                <span className="text-xs text-stone-500">{weight(l.grams)}</span>
                <button
                  onClick={() => remove(l.food.slug)}
                  aria-label={`Remove ${l.food.name}`}
                  title="Remove from meal"
                  className="rounded-full border border-stone-200 px-1.5 py-0.5 text-xs leading-none text-stone-500 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </span>
            </div>
          ))}
          {agg.lines.length === 0 && <p className="text-stone-500">Pick a base to start.</p>}
        </div>
        </div>

        <div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-stone-100 p-2"><div className="text-lg font-semibold">{Math.round(agg.kcal)}</div><div className="text-[10px] text-stone-500">kcal</div></div>
          <div className="rounded-lg bg-stone-100 p-2"><div className="text-lg font-semibold">{agg.protein.toFixed(0)}g</div><div className="text-[10px] text-stone-500">protein</div></div>
          <div className="rounded-lg bg-stone-100 p-2"><div className="text-lg font-semibold">{agg.fibre.toFixed(0)}g</div><div className="text-[10px] text-stone-500">fibre</div></div>
          <div className="rounded-lg bg-stone-100 p-2"><div className="text-lg font-semibold">{agg.carbs.toFixed(0)}g</div><div className="text-[10px] text-stone-500">carbs</div></div>
          <div className="rounded-lg bg-stone-100 p-2"><div className="text-lg font-semibold">{agg.fat.toFixed(0)}g</div><div className="text-[10px] text-stone-500">fat</div></div>
          <div className="rounded-lg bg-stone-100 p-2"><div className="text-lg font-semibold text-emerald-700">{Math.round(agg.folate)}</div><div className="text-[10px] text-stone-500">folate µg (natural)</div></div>
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-stone-200 pt-4">
          <span className="text-sm text-stone-600">Estimated cost</span>
          <span className="text-2xl font-semibold text-emerald-700">£{agg.cost.toFixed(2)}</span>
        </div>

        <div className="mt-3">
          <label className="flex items-center justify-between text-xs text-stone-500">
            <span>Portions</span><span>×{meal.portions}</span>
          </label>
          <input type="range" min={1} max={6} step={1} value={meal.portions}
            onChange={(e) => setMeal((m) => ({ ...m, portions: Number(e.target.value) }))}
            className="mt-1 w-full accent-emerald-600" />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <button onClick={share} className="btn-mobile-full rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500">
            {copied ? "Link copied ✓" : "Share meal"}
          </button>
          <a href={`/api/pdf?m=${shareCode}`} className="btn-mobile-full rounded-xl border border-stone-200 px-3 py-2.5 text-center text-sm font-semibold hover:bg-stone-100">
            Export PDF
          </a>
        </div>
        </div>
      </div>
      <p className="px-2 text-[11px] leading-relaxed text-stone-500">
        Costs are recency-weighted community estimates. Natural folate and added folic acid are
        tracked separately — the badge reflects added folic acid only.
      </p>
    </aside>
  );
}

export default SummaryPanel;
