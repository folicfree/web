"use client";

import { useEffect, useState } from "react";
import { getList, LIST_EVENT, toggleListItem } from "@/lib/shopping";

// Basket icon for product cards (corner of the image) and a labelled variant
// for food pages. Tapping adds/removes the item from the PDF shopping list —
// independent of any meal.

export default function ShoppingButton({ slug, variant = "icon" }: { slug: string; variant?: "icon" | "button" }) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(getList().includes(slug));
    sync();
    window.addEventListener(LIST_EVENT, sync);
    return () => window.removeEventListener(LIST_EVENT, sync);
  }, [slug]);

  if (variant === "button") {
    return (
      <button
        onClick={() => setOn(toggleListItem(slug))}
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
          on ? "border-emerald-600 bg-emerald-50 text-emerald-800" : "border-stone-200 bg-white text-stone-800 hover:bg-stone-100"
        }`}
      >
        {on ? "✓ On your shopping list" : "🧺 Add to shopping list"}
      </button>
    );
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOn(toggleListItem(slug)); }}
      aria-label={on ? "Remove from shopping list" : "Add to shopping list"}
      title={on ? "Remove from shopping list" : "Add to shopping list"}
      className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full text-sm shadow-md transition hover:scale-110 ${
        on ? "bg-emerald-600 text-white" : "bg-white/95 text-stone-800"
      }`}
    >
      {on ? "✓" : "🧺"}
    </button>
  );
}