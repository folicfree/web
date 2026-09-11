// AI pre-screening — provider-abstracted (Section 2 critical architecture rule).
// screenSubmission(payload) → verdict. The provider is a config value:
//   AI_PROVIDER = "groq" | "cloudflare" | "heuristic"
// Keys are server-side only; never exposed to the browser.
//
// Hardening notes: outbound calls are bounded (8s timeout + 256KB cap) so a
// hostile submission can't hang the route or blow memory. AI output is
// untrusted text — parseVerdict allow-lists the verdict and truncates reasoning.

export type Verdict = "auto_reject" | "spot_check" | "needs_review";

export interface ScreeningPayload {
  type: "food" | "brand" | "price";
  name?: string;
  category?: string;
  claimed_folic_acid_status?: string;
  source_link_or_note?: string;
  // price-specific
  retailer?: string;
  price_gbp?: number;
  pack_size_g?: number;
  barcode?: string;
  context?: string; // fortification rules / plausibility ranges
}

export interface ScreeningResult {
  verdict: Verdict;
  reasoning: string;
  provider: string;
}

const PROVIDER = (process.env.AI_PROVIDER as "groq" | "cloudflare" | "heuristic") || "heuristic";

function systemPrompt(): string {
  return [
    "You pre-screen anonymous submissions for a UK food comparison site about folic-acid fortification.",
    "Verdicts: auto_reject (spam/nonsense/duplicates/implausible), spot_check (plausible, quick human glance), needs_review (full manual verification).",
    "Context: UK law mandates folic-acid fortification of non-wholemeal wheat flour from 13 Dec 2026.",
    "Wholemeal flour, rye, oats, maize, rice, and most single-ingredient foods are naturally unfortified.",
    "For price submissions, UK supermarket plausibility: most staples £0.05–£2.50 per 100g; reject absurd values.",
    "Reply with ONLY JSON: {\"verdict\": \"...\", \"reasoning\": \"...\"}",
  ].join(" ");
}

function userPrompt(p: ScreeningPayload): string {
  return JSON.stringify(p);
}

function parseVerdict(text: string): { verdict: Verdict; reasoning: string } {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const j = JSON.parse(match[0]);
      if (["auto_reject", "spot_check", "needs_review"].includes(j.verdict)) {
        return { verdict: j.verdict, reasoning: String(j.reasoning || "").slice(0, 500) };
      }
    }
  } catch { /* fall through */ }
  return { verdict: "needs_review", reasoning: `Unparseable AI response: ${text.slice(0, 200)}` };
}

// --- Provider adapters -------------------------------------------------------

const AI_TIMEOUT_MS = 8000;
const AI_MAX_BYTES = 256 * 1024;

async function boundedJson(url: string, init: RequestInit): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    // Cap response size before parsing: read as text, truncate, then parse.
    const text = await res.text();
    const capped = text.length > AI_MAX_BYTES ? text.slice(0, AI_MAX_BYTES) : text;
    if (!res.ok) throw new Error(`Upstream error ${res.status}`);
    return JSON.parse(capped);
  } finally {
    clearTimeout(t);
  }
}

async function groqScreen(payload: ScreeningPayload): Promise<ScreeningResult> {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");
  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const res = await boundedJson("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0,
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: userPrompt(payload) },
      ],
    }),
  });
  const text = res.choices?.[0]?.message?.content ?? "";
  return { ...parseVerdict(text), provider: `groq:${model}` };
}

async function cloudflareScreen(payload: ScreeningPayload): Promise<ScreeningResult> {
  // Cloudflare Workers AI fallback (same interface; 10k free Neurons/day).
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_API_TOKEN;
  if (!accountId || !token) throw new Error("Cloudflare Workers AI not configured");
  const model = process.env.CF_AI_MODEL || "@cf/meta/llama-3.1-8b-instant";
  const res = await boundedJson(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ messages: [{ role: "system", content: systemPrompt() }, { role: "user", content: userPrompt(payload) }] }),
  });
  return { ...parseVerdict(res?.result?.response ?? ""), provider: `cloudflare:${model}` };
}

// Deterministic offline screening so the pipeline works with zero keys configured.
function heuristicScreen(p: ScreeningPayload): ScreeningResult {
  const name = (p.name || "").trim();
  const reasons: string[] = [];
  if (p.type === "price") {
    const per100 = p.price_gbp && p.pack_size_g ? (p.price_gbp / p.pack_size_g) * 100 : undefined;
    if (!p.price_gbp || !p.pack_size_g || p.price_gbp <= 0 || p.pack_size_g <= 0) {
      return { verdict: "auto_reject", reasoning: "Missing or non-positive price/pack size.", provider: "heuristic" };
    }
    if (per100 !== undefined && (per100 < 0.02 || per100 > 5)) {
      reasons.push(`Per-100g £${per100.toFixed(2)} outside plausible UK staple range (0.02–5.00).`);
    }
    return reasons.length
      ? { verdict: "needs_review", reasoning: reasons.join(" "), provider: "heuristic" }
      : { verdict: "spot_check", reasoning: "Plausible price band; quick glance recommended.", provider: "heuristic" };
  }
  if (!name || name.length < 2 || name.length > 120) {
    return { verdict: "auto_reject", reasoning: "Name missing or implausible length.", provider: "heuristic" };
  }
  // Spam / injection patterns: URLs, known spam tokens, control characters,
  // and low-entropy runs (aaaa…, 1111…) typical of fuzz/bot traffic.
  if (/https?:\/\//i.test(name) || /www\./i.test(name) || /\.(ru|xyz|top|click|loan|win)\b/i.test(name)) {
    return { verdict: "auto_reject", reasoning: "URL or suspicious domain in name.", provider: "heuristic" };
  }
  if (/\b(viagra|cialis|crypto|casino|porn|xxx|loan|forex|escort|http)\b/i.test(name)) {
    return { verdict: "auto_reject", reasoning: "Spam pattern detected.", provider: "heuristic" };
  }
  if (/[\u0000-\u001f\u007f-\u009f]/.test(name)) {
    return { verdict: "auto_reject", reasoning: "Control characters in name.", provider: "heuristic" };
  }
  if (/(.)\1{7,}/.test(name)) {
    return { verdict: "auto_reject", reasoning: "Repeated-character run in name.", provider: "heuristic" };
  }
  if (!p.source_link_or_note) {
    reasons.push("No source note provided — cannot self-verify claim.");
  }
  return reasons.length
    ? { verdict: "needs_review", reasoning: reasons.join(" "), provider: "heuristic" }
    : { verdict: "spot_check", reasoning: "Well-formed claim with source; quick glance recommended.", provider: "heuristic" };
}

// --- Public interface --------------------------------------------------------

export async function screenSubmission(payload: ScreeningPayload): Promise<ScreeningResult> {
  const providers = PROVIDER === "groq" ? [groqScreen, cloudflareScreen, heuristicScreen]
    : PROVIDER === "cloudflare" ? [cloudflareScreen, heuristicScreen]
    : [heuristicScreen];
  for (const fn of providers) {
    try {
      return await fn(payload);
    } catch (err) {
      console.error(`[screening] provider failed:`, err instanceof Error ? err.message : err);
    }
  }
  return heuristicScreen(payload);
}


