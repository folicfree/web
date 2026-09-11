"use client";

import { useEffect, useState } from "react";

// Private admin review queue (Section 5): weighted by AI verdict, verify/reject
// actions. Token entered once, kept in localStorage — no accounts, no cookies.

interface Row { id: string; submitted_name?: string; claimed_category?: string; claimed_folic_acid_status?: string; source_link_or_note?: string; ai_verdict?: string; ai_reasoning?: string; food_slug?: string; retailer?: string; price_gbp?: number; pack_size_g?: number; created_at?: string }

const verdictCls: Record<string, string> = {
  auto_reject: "text-red-700",
  spot_check: "text-emerald-700",
  needs_review: "text-amber-700",
};

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [data, setData] = useState<{ submissions: Row[]; prices: Row[] } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { setToken(localStorage.getItem("ff_admin_token") || ""); }, []);

  const load = (t: string) => {
    fetch("/api/admin/queue", { headers: { "x-admin-token": t } })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || `HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => { setData(d); setError(""); localStorage.setItem("ff_admin_token", t); })
      .catch((e) => { setError(e.message); setData(null); });
  };

  useEffect(() => { if (token) load(token); }, [token]);

  async function act(table: string, id: string, action: "verified" | "rejected") {
    await fetch("/api/admin/queue", { method: "PATCH", headers: { "Content-Type": "application/json", "x-admin-token": token }, body: JSON.stringify({ table, id, action }) });
    if (token) load(token);
  }

  if (!data) {
    return (
      <main className="mx-auto max-w-md px-4 py-20">
        <h1 className="font-display text-2xl">Admin queue</h1>
        <p className="mt-2 text-sm text-stone-500">Private moderation access. Requires ADMIN_TOKEN configured server-side.</p>
        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); setToken(input); }}
        >
          <input value={input} onChange={(e) => setInput(e.target.value)} type="password" placeholder="Admin token" className="flex-1 rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm outline-none" />
          <button className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950">Enter</button>
        </form>
      </main>
    );
  }

  const card = "card p-4";

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Review queue</h1>
        <button onClick={() => { localStorage.removeItem("ff_admin_token"); setToken(""); setData(null); }} className="text-xs text-stone-500 hover:text-stone-700">sign out</button>
      </div>

      <h2 className="mt-8 font-display text-xl">Food / brand submissions ({data.submissions.length})</h2>
      <div className="mt-3 space-y-3">
        {data.submissions.length === 0 && <p className="text-sm text-stone-500">Queue empty.</p>}
        {data.submissions.map((r) => (
          <div key={r.id} className={card}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{r.submitted_name}</span>
              <span className="text-stone-500">{r.claimed_category}</span>
              <span className="text-stone-500">claims: {r.claimed_folic_acid_status}</span>
              <span className={`ml-auto text-xs font-semibold ${verdictCls[r.ai_verdict || ""]}`}>{r.ai_verdict}</span>
            </div>
            {r.ai_reasoning && <p className="mt-1 text-xs text-stone-500">AI: {r.ai_reasoning}</p>}
            {r.source_link_or_note && <p className="mt-1 text-xs text-stone-500">Source: {r.source_link_or_note}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => act("submissions", r.id, "verified")} className="rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-emerald-950">Verify</button>
              <button onClick={() => act("submissions", r.id, "rejected")} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold">Reject</button>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-display text-xl">Price submissions ({data.prices.length})</h2>
      <div className="mt-3 space-y-3">
        {data.prices.length === 0 && <p className="text-sm text-stone-500">Queue empty.</p>}
        {data.prices.map((r) => (
          <div key={r.id} className={card}>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">{r.food_slug}</span>
              <span className="text-stone-500">{r.retailer} · £{r.price_gbp} / {r.pack_size_g}g</span>
              <span className={`ml-auto text-xs font-semibold ${verdictCls[r.ai_verdict || ""]}`}>{r.ai_verdict}</span>
            </div>
            {r.ai_reasoning && <p className="mt-1 text-xs text-stone-500">AI: {r.ai_reasoning}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => act("price_submissions", r.id, "verified")} className="rounded-lg bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-emerald-950">Verify</button>
              <button onClick={() => act("price_submissions", r.id, "rejected")} className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold">Reject</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
