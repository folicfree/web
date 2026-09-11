import { NextResponse } from "next/server";
import { screenSubmission, type ScreeningPayload } from "@/lib/ai/screen";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const runtime = "edge";

// Anonymous submission endpoint (Sections 5, 10). No auth, no cookies.
// Rate-limited by IP/hour, independently of AI provider limits.
// Verdicts are logged and queued for manual review — nothing auto-publishes.

// --- Hardening: closed vocabularies + strict bounds (reject before screen) ---
const CATEGORIES = new Set(["base", "protein", "veg", "extra"]);
const CLAIMS = new Set(["confirmed_clean", "confirmed_added", "needs_review"]);
const RETAILERS = new Set(["ASDA", "Tesco", "Sainsbury's", "Other"]);
const MAX_BODY_BYTES = 8 * 1024;

// Bare-minimum URL sanity for the optional source link: free text is fine, but
// anything that smells like a link must be http(s) with no embedded
// credentials — javascript:/data:/vbscript:/file: anywhere is a reject.
function sourceNoteOk(v: string): boolean {
  const s = v.trim();
  if (!s) return true; // optional
  if (/(javascript|data|vbscript|file)\s*:/i.test(s)) return false;
  if (/^https?:\/\/[^/]*@/i.test(s)) return false; // userinfo smuggling
  const urls = s.match(/https?:\/\/[^\s<>"']+/gi) || [];
  for (const u of urls) {
    try {
      const parsed = new URL(u);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
      if (parsed.hostname.length > 253 || /[<>"'\s]/.test(u)) return false;
    } catch {
      return false; // looks like a URL but doesn't parse
    }
  }
  return true;
}

// Supabase REST insert when configured (submissions / price_submissions tables).
// The service key stays server-side; anonymous role has INSERT-only anyway.
async function persistToQueue(type: "food" | "brand" | "price", payload: ScreeningPayload, verdict: { verdict: string; reasoning: string; provider: string }) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.log("[submission-queue]", { type, verdict: verdict.verdict, provider: verdict.provider, payload });
    return;
  }
  const table = type === "price" ? "price_submissions" : "submissions";
  const row = type === "price"
    ? { food_slug: payload.name, retailer: payload.retailer, price_gbp: payload.price_gbp, pack_size_g: payload.pack_size_g, ai_verdict: verdict.verdict, ai_reasoning: verdict.reasoning, submission_status: "pending_review" }
    : { submission_type: type, submitted_name: payload.name, claimed_category: payload.category, claimed_folic_acid_status: payload.claimed_folic_acid_status, source_link_or_note: payload.source_link_or_note, barcode: payload.barcode || null, ai_verdict: verdict.verdict, ai_reasoning: verdict.reasoning, submission_status: "pending_review" };
  try {
    await fetch(`${url}/rest/v1/${table}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}`, Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
  } catch (err) {
    console.error("[submission-queue] supabase insert failed:", err);
    console.log("[submission-queue-fallback]", { type, payload, verdict });
  }
}

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  const rl = rateLimit("submit:" + ip);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many submissions. Try again in ~${rl.retryAfterMin} minutes.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterMin * 60) } }
    );
  }

  const rawLen = req.headers.get("content-length");
  if (rawLen && Number(rawLen) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  let body: ScreeningPayload;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload too large." }, { status: 413 });
    }
    body = JSON.parse(text);
    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // Honeypot (server-side backstop): bots fill it, humans can't see it.
  // Silent success so attackers can't probe the filter.
  if ((body as unknown as Record<string, unknown>).website) {
    return NextResponse.json({
      ok: true,
      verdict: "spot_check",
      reasoning: "ok",
      message: "Thanks — submitted anonymously for review. Nothing publishes until a human verifies it.",
    });
  }

  // Input validation / sanitisation before any DB or AI call (Section 10).
  // Closed vocabularies + strict numeric bounds: anything outside is a 400,
  // so junk never reaches the AI screener, the logs, or Supabase.
  if (!["food", "brand", "price"].includes(body.type)) {
    return NextResponse.json({ error: "Unknown submission type." }, { status: 400 });
  }
  const clean: ScreeningPayload = {
    type: body.type,
    name: (body.name || "").toString().slice(0, 200).trim(),
    category: (body.category || "").toString().slice(0, 50),
    claimed_folic_acid_status: (body.claimed_folic_acid_status || "").toString().slice(0, 30),
    source_link_or_note: (body.source_link_or_note || "").toString().slice(0, 500),
    barcode: (body.barcode || "").toString().replace(/\D/g, "").slice(0, 14),
    retailer: (body.retailer || "").toString().slice(0, 30),
    price_gbp: Number.isFinite(Number(body.price_gbp)) ? Number(body.price_gbp) : undefined,
    pack_size_g: Number.isFinite(Number(body.pack_size_g)) ? Number(body.pack_size_g) : undefined,
  };

  if (clean.type !== "price") {
    const foodName = clean.name || "";
    if (foodName.length < 2 || foodName.length > 120) {
      return NextResponse.json({ error: "Name must be 2–120 characters." }, { status: 400 });
    }
    if (clean.category && !CATEGORIES.has(clean.category)) {
      return NextResponse.json({ error: "Unknown category." }, { status: 400 });
    }
    if (clean.claimed_folic_acid_status && !CLAIMS.has(clean.claimed_folic_acid_status)) {
      return NextResponse.json({ error: "Unknown folic-acid claim." }, { status: 400 });
    }
    if (clean.barcode && !/^\d{8}$|^\d{12,14}$/.test(clean.barcode)) {
      return NextResponse.json({ error: "Barcode must be 8 or 12–14 digits." }, { status: 400 });
    }
    if (!sourceNoteOk(clean.source_link_or_note || "")) {
      return NextResponse.json({ error: "Source link looks invalid." }, { status: 400 });
    }
  } else {
    const priceName = clean.name || "";
    if (priceName.length < 2 || priceName.length > 120) {
      return NextResponse.json({ error: "Food reference must be 2–120 characters." }, { status: 400 });
    }
    if (!clean.retailer || !RETAILERS.has(clean.retailer)) {
      return NextResponse.json({ error: "Unknown retailer." }, { status: 400 });
    }
    if (!(clean.price_gbp! > 0) || clean.price_gbp! > 1000 || !(clean.pack_size_g! >= 1) || clean.pack_size_g! > 50000) {
      return NextResponse.json({ error: "Price or pack size out of range." }, { status: 400 });
    }
    const per100 = (clean.price_gbp! / clean.pack_size_g!) * 100;
    if (per100 < 0.02 || per100 > 5) {
      return NextResponse.json({ error: "Per-100g price outside plausible UK staple range." }, { status: 400 });
    }
  }

  const verdict = await screenSubmission(clean);
  await persistToQueue(clean.type, clean, verdict);

  return NextResponse.json({
    ok: true,
    verdict: verdict.verdict,
    reasoning: verdict.reasoning,
    message:
      verdict.verdict === "auto_reject"
        ? "That didn't look like a real submission. If it was genuine, please try again with more detail."
        : "Thanks — submitted anonymously for review. Nothing publishes until a human verifies it.",
  });
}
