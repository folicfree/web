// Server-side Supabase REST helpers. The service key is server-only.
// All functions degrade gracefully: with no Supabase configured, callers fall
// back to the static seed data (static-first architecture, Section 3.1).

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && serviceKey);

export async function sbFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!supabaseConfigured) return null;
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey!,
        Authorization: `Bearer ${serviceKey!}`,
        ...(init?.headers || {}),
      },
      // Next.js: revalidate overlays rather than hitting DB every render
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status} on ${path}`);
    return (await res.json()) as T;
  } catch (err) {
    console.error("[supabase]", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Rows from the `foods` table that act as a moderation overlay over seed data. */
export function fetchFoodsOverlay() {
  return sbFetch<Record<string, unknown>[]>("foods?select=slug,folic_acid_status,cost_per_100g_gbp,source_note,standard_portion_label");
}

/** Rows from the `brands` table (curated, moderated there instead of seed). */
export function fetchBrands() {
  return sbFetch<Record<string, unknown>[]>("brands?select=*&order=created_at.desc");
}

/** Pending submissions for the admin review queue. */
export function fetchPending(table: "submissions" | "price_submissions") {
  return sbFetch<Record<string, unknown>[]>(`${table}?submission_status=eq.pending_review&select=*&order=created_at.desc&limit=100`);
}

/** Verify/reject a queue row (service role bypasses RLS by design). */
export function updateQueueRow(table: "submissions" | "price_submissions", id: string, submission_status: string) {
  return sbFetch<unknown>(`${table}?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ submission_status }),
  });
}
