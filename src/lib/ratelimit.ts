// Independent endpoint rate limiting (Section 5/10) — by namespaced key, per hour.
// In-memory Map works for a single Next.js instance; on Cloudflare Workers this
// should map to a KV/Durable Object counter. Not a substitute for Cloudflare WAF.

// Burst guard: max 3 hits per key per 10s window, then the hourly bucket below.
const BURST_WINDOW_MS = 10_000;
const BURST_MAX = 3;
const bursts = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = Number(process.env.SUBMISSION_RATE_LIMIT || 10);

const hits = new Map<string, number[]>(); // ip -> timestamps

export function rateLimit(key: string): { ok: boolean; remaining: number; retryAfterMin: number } {
  const now = Date.now();
  const b = (bursts.get(key) || []).filter((t) => now - t < BURST_WINDOW_MS);
  if (b.length >= BURST_MAX) {
    return { ok: false, remaining: 0, retryAfterMin: 1 };
  }
  b.push(now);
  bursts.set(key, b);
  const list = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= LIMIT) {
    const oldest = list[0];
    return { ok: false, remaining: 0, retryAfterMin: Math.ceil((WINDOW_MS - (now - oldest)) / 60000) };
  }
  list.push(now);
  hits.set(key, list);
  return { ok: true, remaining: LIMIT - list.length, retryAfterMin: 0 };
}

export function clientIp(headers: Headers): string {
  // Prefer Cloudflare's own header (can't be spoofed past the proxy), then the
  // leftmost forwarded entry. Anything else is "unknown" — rate-limited as one
  // shared bucket rather than trusted.
  const cf = headers.get("cf-connecting-ip")?.trim();
  if (cf && /^[0-9a-fA-F:., ]+$/.test(cf)) return cf;
  const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (xff && /^[0-9a-fA-F:.]+$/.test(xff)) return xff;
  return "unknown";
}
