import type { Metadata } from "next";
import Link from "next/link";
import { foods as seedFoods, getCross } from "@/data/foods";
import { badgeMeta, faBadgeText, gbp, portionCost, type FaStatus } from "@/lib/nutrition";
import { loadCatalog } from "@/lib/catalog";
import AddToMealButton from "@/components/AddToMealButton";
import ShoppingButton from "@/components/ShoppingButton";

// Indexable per-food page (Section 8) with schema.org NutritionInformation —
// captures long-tail search ("is [food] folic acid free").
// Seed data renders statically; the Supabase overlay refreshes it (300s).

export const revalidate = 300;

export function generateStaticParams() {
  return seedFoods.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { bySlug } = await loadCatalog();
  const food = bySlug.get(slug);
  if (!food) return {};
  const q = food.fa === "clean" ? `no added folic acid` : food.fa === "added" ? `contains added folic acid` : `folic acid status unverified`;
  return { title: `${food.name} — ${q}`, description: `${food.name}: ${faBadgeText[food.fa as FaStatus]}. ${food.portionLabel} costs about ${gbp(portionCost(food))}. Natural folate ${food.folate}µg/100g.` };
}

export default async function FoodPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { bySlug } = await loadCatalog();
  const food = bySlug.get(slug);
  if (!food) return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="font-display text-3xl">Food not found</h1></main>;

  const badge = badgeMeta[food.fa];
  const cross = getCross(food.slug);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NutritionInformation",
    name: food.name,
    calories: `${food.kcal} kcal per 100g`,
    carbohydrateContent: `${food.carbs} g per 100g`,
    proteinContent: `${food.protein} g per 100g`,
    fatContent: `${food.fat} g per 100g`,
    fiberContent: `${food.fibre} g per 100g`,
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 text-center">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Link href="/build" className="text-xs text-stone-500 hover:text-stone-700">← Meal builder</Link>
      <h1 className="mt-2 font-display text-4xl">{food.name}</h1>
      <div className="mt-3 flex justify-center">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}>
          <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
      </div>
      {food.note && <p className="mt-3 text-sm text-stone-600">{food.note}</p>}

      {/* Product identity: photo (Open Food Facts) + pack as sold */}
      <div className="card mt-6 flex flex-col items-center gap-6 p-6 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-100">
          {food.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={food.image} alt={food.name} className="h-full w-full object-cover" />
          ) : (
            <span className="display text-4xl text-stone-400">{food.name.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          {food.packG && food.packPrice ? (
            <>
              <p className="text-lg font-semibold">As sold: {food.packG}g pack · £{food.packPrice.toFixed(2)}</p>
              <p className="mt-1 text-sm text-stone-500">
                {gbp(portionCost(food))} per {food.portionLabel.toLowerCase()} · {food.cost >= 1 ? `£${food.cost.toFixed(2)}` : `${Math.round(food.cost * 100)}p`} per 100g
              </p>
            </>
          ) : (
            <p className="text-lg font-semibold">{gbp(portionCost(food))} per {food.portionLabel.toLowerCase()}</p>
          )}
          {food.producerUrl && food.fa === "clean" && (
            <a
              href={food.producerUrl}
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm font-medium text-emerald-700 hover:text-emerald-800 sm:justify-start"
            >
              Visit the producer <span aria-hidden>↗</span>
              <span className="text-[10px] font-normal text-stone-400">(independent editorial link)</span>
            </a>
          )}
          {food.producerUrl && food.fa !== "clean" && (
            <a href={food.producerUrl} target="_blank" rel="nofollow sponsored noopener" className="mt-3 inline-flex items-center justify-center gap-1.5 text-sm text-stone-500 hover:text-stone-700 sm:justify-start">
              Producer&apos;s site <span aria-hidden>↗</span>
            </a>
          )}
        </div>
      </div>

      <div className="card mt-6 p-6">
        <div className="grid grid-cols-3 gap-3 text-center sm:grid-cols-6">
          {[["kcal", food.kcal], ["protein", `${food.protein}g`], ["carbs", `${food.carbs}g`], ["fat", `${food.fat}g`], ["fibre", `${food.fibre}g`], ["natural folate", `${food.folate}µg`]].map(([k, v]) => (
            <div key={k as string} className="rounded-lg bg-stone-100 p-3"><div className="font-semibold">{v}</div><div className="text-[10px] text-stone-500">{k} /100g</div></div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-stone-700">
          <span>Portion: {food.portionLabel} ({food.portionG}g)</span>
          <span className="font-semibold text-emerald-700">{gbp(portionCost(food))} per portion</span>
        </div>
      </div>

      {cross && (
        <div className="card mt-4 p-6">
          <h2 className="font-display text-xl">Comparisons for {food.name.toLowerCase()}</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {cross.lateral.map((s) => { const f = bySlug.get(s); return f ? (
              <Link key={s} href={`/food/${s}`} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm hover:border-stone-400">
                <span>{f.name}</span><span className="text-xs text-stone-500">{gbp(f.portionG * f.cost)}</span>
              </Link>) : null; })}
          </div>
          <p className="mt-3 text-xs text-stone-500">Vertical upgrades (same job, different food): {cross.vertical.map((s) => bySlug.get(s)?.name).filter(Boolean).join(", ")}</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
        <AddToMealButton slug={food.slug} />
        <ShoppingButton slug={food.slug} variant="button" />
        <Link href="/submit" className="btn-mobile-full inline-flex items-center justify-center rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold hover:bg-stone-100">Correct or update this</Link>
      </div>
    </main>
  );
}
