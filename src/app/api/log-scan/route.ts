import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Anonymous scan logging — captures every barcode scan for data quality.
// When AI/heuristic screening flags a product as "no added folic acid",
// that data point is preserved in the verification queue instead of being lost.
// No PII, no accounts — just the barcode, result, and timestamp.

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY);

// Simple in-memory rate limiter (resets on deploy)
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30; // max scans per IP per window
const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_MAX;
}

export async function POST(req: Request) {
  // Rate limit by IP — namespaced so one endpoint can't burn another's budget.
  const ip = req.headers.get("cf-connecting-ip")?.trim() || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (/^[0-9a-fA-F:., ]+$/.test(ip) === false) {
    return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
  }
  if (rateLimited("log-scan:" + ip)) {
    return NextResponse.json({ ok: false, error: "Rate limit exceeded." }, { status: 429 });
  }

  // Validate input
  let body: { ean?: string; found?: boolean; foodSlug?: string; faStatus?: string; offName?: string; offBrands?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const ean = body.ean;
  if (!ean || !/^\d{6,14}$/.test(ean)) {
    return NextResponse.json({ ok: false, error: "Invalid EAN." }, { status: 400 });
  }

  const found = body.found === true;
  const foodSlug = typeof body.foodSlug === "string" ? body.foodSlug.slice(0, 120) : null;
  const faStatus = body.faStatus === "clean" || body.faStatus === "added" || body.faStatus === "review" ? body.faStatus : null;
  const offName = typeof body.offName === "string" ? body.offName.slice(0, 300) : null;
  const offBrands = typeof body.offBrands === "string" ? body.offBrands.slice(0, 300) : null;
  const userAgent = (req.headers.get("user-agent") || "").slice(0, 300) || null;

  // Log to Supabase if configured
  if (SUPABASE_ENABLED) {
    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await supabase.from("scan_logs").insert({
        ean,
        found,
        food_slug: foodSlug,
        folic_acid_status: faStatus,
        off_name: offName,
        off_brands: offBrands,
        user_agent: userAgent,
      });
    } catch {
      // Swallow errors — logging failures shouldn't break the user experience
    }
  }

  return NextResponse.json({ ok: true });
}