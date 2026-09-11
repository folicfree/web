import type { Metadata } from "next";
import Link from "next/link";
import { decodeMeal } from "@/lib/share";
import { aggregate, badgeMeta, faBadgeText, gbp } from "@/lib/nutrition";
import { getFood } from "@/data/foods";

// Share landing page — meal decoded from URL only (Section 6.7). Nothing stored.
export const runtime = "edge";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ m?: string }> }): Promise<Metadata> {
  const { m } = await searchParams;
  const meal = m ? decodeMeal(m) : null;
  const agg = meal ? aggregate(meal) : null;
  const title = agg && agg.lines.length
    ? `${agg.lines.map((l) => l.food.name).slice(0, 3).join(" + ")} — ${gbp(agg.cost)}`
    : "A meal built on FolicFree";
  return {
    title,
    description: agg ? `${Math.round(agg.kcal)} kcal · ${badgeMeta[agg.badge].label} · folicfree.com` : "Build meals without added folic acid",
    openGraph: { images: [`/api/og?m=${m ?? ""}`] },
    twitter: { card: "summary_large_image", images: [`/api/og?m=${m ?? ""}`] },
  };
}

export default async function SharePage({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams;
  const meal = m ? decodeMeal(m) : null;
  const agg = meal ? aggregate(meal) : null;

  if (!agg || agg.lines.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl">That meal link didn&apos;t decode</h1>
        <p className="mt-3 text-stone-600">The share code looks incomplete — meal links only contain data, nothing is stored server-side.</p>
        <Link href="/build" className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-emerald-950 hover:bg-emerald-400">Build your own</Link>
      </main>
    );
  }

  const badge = badgeMeta[agg.badge];
  const tweetText = encodeURIComponent(`${agg.lines.map((l) => l.food.name).join(" + ")} — ${gbp(agg.cost)}, ${badge.label.toLowerCase()}`);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <img src={`/api/og?m=${m}`} alt="Meal share card" className="w-full rounded-2xl border border-stone-200" />
      <div className="card mt-6 p-6">
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${badge.cls}`}>
          <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
          {badge.label}
        </span>
        <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          {agg.lines.map((l) => (
            <Link key={l.food.slug} href={`/food/${l.food.slug}`} className="flex items-center justify-between gap-2 rounded-lg border border-stone-200 px-3 py-2 hover:border-stone-400">
              <span>{l.food.name}</span>
              <span className="text-xs text-stone-500">{faBadgeText[l.food.fa]}</span>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-stone-700">
          <span>{Math.round(agg.kcal)} kcal</span>
          <span>{agg.protein.toFixed(0)}g protein</span>
          <span>{agg.fibre.toFixed(0)}g fibre</span>
          <span>{Math.round(agg.folate)}µg natural folate</span>
          <span className="font-semibold text-emerald-700">{gbp(agg.cost)}</span>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <a className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 hover:bg-emerald-400" href="/build">Build your own</a>
          <a className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100" target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?text=${tweetText}`}>Share on X</a>
          <a className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${tweetText}`}>WhatsApp</a>
          <a className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold hover:bg-stone-100" href={`/api/pdf?m=${m}`}>PDF</a>
        </div>
      </div>
    </main>
  );
}
