import { NextResponse } from "next/server";
import { fetchPending, supabaseConfigured, updateQueueRow } from "@/lib/supabase";

// Admin review-queue API (Section 5). Token-gated via x-admin-token —
// the token lives in ADMIN_TOKEN env, server-side only.

function authed(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return false; // no token configured = queue disabled
  return req.headers.get("x-admin-token") === token;
}

export async function GET(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  if (!supabaseConfigured) {
    return NextResponse.json({ error: "Supabase not configured — the queue lives there. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }
  // Cache-busting: queue data must never be served stale.
  const [submissions, prices] = await Promise.all([
    fetchPending("submissions"),
    fetchPending("price_submissions"),
  ]);
  return NextResponse.json(
    { submissions: submissions ?? [], prices: prices ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

export async function PATCH(req: Request) {
  if (!authed(req)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = await req.json().catch(() => null);
  const table = body?.table;
  const id = body?.id;
  const action = body?.action; // "verified" | "rejected"
  if (!["submissions", "price_submissions"].includes(table) || typeof id !== "string" || !["verified", "rejected"].includes(action)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  await updateQueueRow(table, id, action);
  return NextResponse.json({ ok: true });
}
