import { NextResponse } from "next/server";
import { loadCatalog } from "@/lib/catalog";

// Serves the merged catalog (seed + Supabase overlay) to client components.
// Falls back to bundled seed when Supabase isn't configured.
export const revalidate = 300;

export async function GET() {
  const catalog = await loadCatalog();
  return NextResponse.json({ source: catalog.source, foods: catalog.foods });
}
