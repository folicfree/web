"use client";

// Food-page action: hands the product to the meal builder via localStorage
// (ff_meal_add) and navigates there. The builder picks it up on mount.

export default function AddToMealButton({ slug, compact = false }: { slug: string; compact?: boolean }) {
  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); localStorage.setItem("ff_meal_add", slug); location.href = "/build"; }}
      className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 font-semibold text-white transition hover:bg-emerald-500 ${compact ? "px-2 py-1.5 text-xs" : "px-5 py-2.5 text-sm"}`}
    >
      Add to a meal <span aria-hidden>→</span>
    </button>
  );
}