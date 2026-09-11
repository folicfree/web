import { NextResponse } from "next/server";

// Barcode lookup — queries Open Food Facts (free, ODbL) by EAN and returns the
// product's name/brands so the scanner can show something even when the food
// isn't yet mapped in our catalog. No key required.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ean = (searchParams.get("ean") || "").trim();
  if (!/^\d{8}$|^\d{12,14}$/.test(ean)) {
    return NextResponse.json({ ok: false, error: "Invalid EAN." }, { status: 400 });
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    let data: any = null;
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${ean}.json`, {
        headers: { "User-Agent": "FolicFree/0.1 (folicfree.com)" },
        next: { revalidate: 86400 },
        signal: ctrl.signal,
      });
      const text = await res.text();
      data = JSON.parse(text.slice(0, 256 * 1024));
    } finally {
      clearTimeout(t);
    }
    if (data?.status !== 1 || !data.product) {
      return NextResponse.json({ ok: true, off: null });
    }
    const p = data.product;
    // OFF fields are third-party text: coerce to string and cap length so a
    // hostile product record can't push oversized content into our responses/DB.
    const str = (v: unknown, max: number): string | null =>
      typeof v === "string" && v ? v.slice(0, max) : null;
    return NextResponse.json({
      ok: true,
      off: { name: str(p.product_name, 300), brands: str(p.brands, 300), image: str(p.image_front_url, 500) },
    });
  } catch {
    return NextResponse.json({ ok: true, off: null });
  }
}