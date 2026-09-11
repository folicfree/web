import { type FaStatus, type Food } from "@/data/foods";
import { seedBySlug } from "@/lib/catalog";

export type { FaStatus } from "@/data/foods";

// Meal state is shareable via URL only (Section 6.7) — no server persistence.
export interface MealState {
  base?: string;
  protein?: string;
  veg: string[];
  extra: string[];
  portions: number; // portion multiplier
  units: "metric" | "imperial";
}

export const emptyMeal: MealState = { veg: [], extra: [], portions: 1, units: "metric" };

export interface MealLine {
  food: Food;
  grams: number;
}

export interface Aggregates {
  lines: MealLine[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fibre: number;
  folate: number; // natural folate only
  cost: number;
  badge: FaStatus;
  flagged: MealLine[];
  reviews: MealLine[];
}

export function mealLines(meal: MealState, bySlug: Map<string, Food> = seedBySlug): MealLine[] {
  const slugs = [meal.base, meal.protein, ...(meal.veg ?? []), ...(meal.extra ?? [])].filter(Boolean) as string[];
  return slugs
    .map((s) => ({ food: bySlug.get(s), slug: s }))
    .filter((x): x is { food: Food; slug: string } => Boolean(x.food))
    .map(({ food }) => ({ food, grams: food.portionG * meal.portions }));
}

export function aggregate(meal: MealState, bySlug: Map<string, Food> = seedBySlug): Aggregates {
  const lines = mealLines(meal, bySlug);
  const per100 = (pick: (f: Food) => number) => lines.reduce((t, l) => t + (pick(l.food) * l.grams) / 100, 0);
  const flagged = lines.filter((l) => l.food.fa === "added");
  const reviews = lines.filter((l) => l.food.fa === "review");
  const badge: FaStatus = flagged.length ? "added" : reviews.length ? "review" : lines.length ? "clean" : "review";
  return {
    lines,
    kcal: per100((f) => f.kcal),
    protein: per100((f) => f.protein),
    carbs: per100((f) => f.carbs),
    fat: per100((f) => f.fat),
    fibre: per100((f) => f.fibre),
    folate: per100((f) => f.folate),
    cost: per100((f) => f.cost),
    badge,
    flagged,
    reviews,
  };
}

export const badgeMeta: Record<FaStatus, { label: string; cls: string; dot: string }> = {
  clean: { label: "No added folic acid", cls: "bg-emerald-100 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
  review: { label: "Some items unverified", cls: "bg-amber-100 text-amber-800 border-amber-300", dot: "bg-amber-500" },
  added: { label: "Contains added folic acid", cls: "bg-red-100 text-red-800 border-red-300", dot: "bg-red-500" },
};

export function gbp(n: number): string {
  return `£${n.toFixed(2)}`;
}

/** £ cost of one standard portion (portionG grams at cost £/100g). */
export function portionCost(f: Food): number {
  return (f.portionG * f.cost) / 100;
}

export const faBadgeText: Record<FaStatus, string> = {
  clean: "Folic-acid clean",
  added: "Folic acid added",
  review: "Unverified",
};
