import type { MealState } from "@/lib/nutrition";

// Encode/decode meal state as base64url JSON for share URLs (Section 6.7).
// Nothing is persisted server-side — the meal lives entirely in the URL.

export function encodeMeal(meal: MealState): string {
  const json = JSON.stringify(meal);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeMeal(code: string): MealState | null {
  try {
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    const parsed = JSON.parse(new TextDecoder().decode(bytes));
    if (typeof parsed !== "object" || parsed === null) return null;
    return { ...parsed, portions: Number(parsed.portions) || 1, units: parsed.units === "imperial" ? "imperial" : "metric", veg: parsed.veg ?? [], extra: parsed.extra ?? [] } as MealState;
  } catch {
    return null;
  }
}
