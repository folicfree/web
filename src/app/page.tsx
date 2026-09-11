import Link from "next/link";
import { loadCatalog } from "@/lib/catalog";
import InstantSearch from "@/components/InstantSearch";
import VisualCarousel from "@/components/VisualCarousel";
import BarcodeScanner from "@/components/BarcodeScanner";

export const revalidate = 300;

export default async function Home() {
  const { foods } = await loadCatalog();
  const cleanCount = foods.filter((f) => f.fa === "clean").length;
  const cleanFoods = foods.filter((f) => f.fa === "clean");

  return (
    <main>
      <section className="hero-mesh overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pb-8 pt-12 text-center md:pt-20">
          <h1 className="display mx-auto max-w-4xl text-4xl md:text-6xl">
            Most flour is about to be fortified.{" "}
            <span className="italic text-emerald-700">Find what isn&apos;t.</span>
          </h1>

          {/* Scanner is the hero — first thing users see */}
          <div className="mx-auto mt-8 max-w-3xl">
            <BarcodeScanner variant="hero" />
          </div>

          {/* Scanner tagline */}
          <div className="mx-auto mt-8 max-w-3xl">
            <h2 className="display text-3xl md:text-4xl">Scan &amp; Plan</h2>
            <p className="mt-2 text-lg text-[color:var(--ink-dim)]">Save Your Selections &amp; Build Your Meal</p>
            <p className="mt-1 text-sm italic text-[color:var(--ink-faint)]">Export your shopping list or meal to a PDF</p>
          </div>

          {/* Secondary paths */}
          <div className="mx-auto mt-8 max-w-md">
            <div className="w-full">
              <InstantSearch />
            </div>
            <div className="mt-3 flex gap-3">
              <Link href="/build" className="btn-ghost btn-mobile-full flex-1 !px-5 !py-2.5">Build a meal <span aria-hidden>→</span></Link>
              <Link href="/brands" className="btn-ghost btn-mobile-full flex-1 !px-5 !py-2.5">Clean brand directory</Link>
            </div>
          </div>

          <div className="mx-auto mt-10 max-w-xl">
            <div className="accent-line" />
            <div className="grid grid-cols-2 divide-x divide-stone-200 py-6">
              <div><div className="display text-4xl text-emerald-700">{foods.length}</div><div className="mt-1.5 text-xs tracking-wide text-[color:var(--ink-faint)]">foods tracked</div></div>
              <div><div className="display text-4xl text-emerald-700">{cleanCount}</div><div className="mt-1.5 text-xs tracking-wide text-[color:var(--ink-faint)]">confirmed clean</div></div>
            </div>
            <div className="accent-line" />
            <h3 className="display mx-auto mt-5 max-w-md text-xl md:text-2xl text-[color:var(--ink-dim)]">
              Every food you scan is added to a list for manual checking by a real person<br />
              <span className="my-1 block text-center text-emerald-700" aria-hidden>~</span>
              You&apos;re helping everyone just by using the service.
            </h3>
          </div>
        </div>
      </section>
      {/* Clean-foods carousel: multi-row, searchable, add-to-meal + shop on every card */}
      <VisualCarousel
        heading="What you CAN eat — no added folic acid"
        sub="Every item here is flagged free of added folic acid. Photos are the actual products; tap any card for the full breakdown or save it straight to your meal."
        items={cleanFoods}
      />
    </main>
  );
}