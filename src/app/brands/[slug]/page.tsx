import type { Metadata } from "next";
import { brands } from "@/data/brands";

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const b = brands.find((x) => x.slug === slug);
  return b ? { title: `${b.brand_name} ${b.product_line}` } : {};
}

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const b = brands.find((x) => x.slug === slug);
  if (!b) return <main className="mx-auto max-w-3xl px-4 py-20 text-center"><h1 className="font-display text-3xl">Brand not found</h1></main>;

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <a href="/brands" className="text-xs text-stone-500 hover:text-stone-700">← Directory</a>
      <h1 className="mt-2 font-display text-4xl">{b.brand_name}</h1>
      <p className="mt-1 text-stone-600">{b.product_line}</p>
      <p className="mt-6 leading-relaxed text-stone-700">{b.description}</p>
      <dl className="card mt-6 grid gap-3 p-6 text-sm sm:grid-cols-2">
        <div><dt className="text-stone-500">Verification</dt><dd className="mt-1 font-semibold">{b.verification_status.replace("_", " ")}</dd></div>
        <div><dt className="text-stone-500">Source</dt><dd className="mt-1">{b.source_note}</dd></div>
        {b.where_to_buy_url && (
          <div className="sm:col-span-2">
            <dt className="text-stone-500">Where to buy</dt>
            <dd className="mt-1"><a className="text-emerald-700 underline" href={b.where_to_buy_url} target="_blank" rel="noopener nofollow">Retailer listing (affiliate slot)</a></dd>
          </div>
        )}
        {b.producer_url && b.verification_status === "confirmed_clean" && (
          <dl className="sm:col-span-2">
            <dt className="text-zinc-500">Producer</dt>
            <dd className="mt-1">
              {/*
                Google-compliant link relationship:
                • confirmed_clean + no paid tier → genuine editorial citation, normal dofollow
                • any paid tier (featured / native_suggestion) → must carry rel="sponsored nofollow"
                  (firewall: sponsored tier can only exist on confirmed_clean brands)
              */}
              <a
                className="text-emerald-700 underline underline-offset-4"
                href={b.producer_url}
                target="_blank"
                rel={b.sponsored_tier === "none" ? "noopener" : "nofollow sponsored noopener"}
              >
                {b.brand_name} — official site <span aria-hidden>↗</span>
              </a>
            </dd>
          </dl>
        )}
      </dl>
    </main>
  );
}
