import type { Metadata } from "next";
import Link from "next/link";
import { brands } from "@/data/brands";

// Brand directory (Section 6.8). Verification firewall: a sponsored tier can
// only ever appear alongside verification_status === "confirmed_clean" —
// enforced here at render time as well as at data entry.

export const metadata: Metadata = {
  title: "Clean brand directory",
  description: "UK brands whose breads and staples carry no added folic acid — with where to buy and honest cost comparisons.",
};

export default function BrandsPage() {
  const visible = [...brands].sort((a, b) => {
    const rank = (b: typeof a) => (b.sponsored_tier === "featured" ? 1 : 0);
    return rank(b) - rank(a);
  });
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl">Clean brand directory</h1>
      <p className="mt-3 max-w-2xl text-stone-600">
        Every listing is verified against actual packaging before it appears. Sponsored placement
        can buy prominence — it can never buy past verification.
      </p>
      <div className="mt-8 space-y-4">
        {visible.map((b) => (
          <article key={b.slug} className="card p-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl">
                <Link href={`/brands/${b.slug}`} className="hover:text-emerald-700">{b.brand_name}</Link>
              </h2>
              <span className="text-sm text-stone-500">— {b.product_line}</span>
              {b.sponsored_tier === "featured" && (
                <span className="ml-auto rounded-full border border-sky-400/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">Featured</span>
              )}
              {b.verification_status === "confirmed_clean" && (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">Verified clean</span>
              )}
              {b.verification_status === "needs_review" && (
                <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">Verification pending</span>
              )}
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{b.description}</p>
            <p className="mt-3 text-xs text-stone-500">Source: {b.source_note}</p>
          </article>
        ))}
      </div>
    </main>
  );
}
