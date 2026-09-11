"use client";

import { useState } from "react";

// Anonymous submission forms (Sections 5, 6). No login, no required contact.
// POSTs to /api/submit which rate-limits and AI-screens before queuing.

type Kind = "food" | "brand" | "price";

export default function SubmitPage() {
  const [kind, setKind] = useState<Kind>("food");
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus(null);
    const fd = new FormData(e.currentTarget);
    const payload: Record<string, unknown> = { type: kind };
    for (const [k, v] of fd.entries()) payload[k] = v;
    if (payload.website) {
      // Honeypot filled: pretend success so bots can't probe the filter.
      setStatus({ ok: true, msg: "Thanks — submitted anonymously for review." });
      e.currentTarget.reset();
      setBusy(false);
      return;
    }
    delete payload.website;
    try {
      const res = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      setStatus({ ok: res.ok && data.ok, msg: data.message || data.error || "Something went wrong." });
      if (res.ok && data.ok) e.currentTarget.reset();
    } catch {
      setStatus({ ok: false, msg: "Network error — please try again." });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full rounded-lg border border-stone-200 bg-stone-100 px-3 py-2 text-sm outline-none placeholder:text-stone-500 focus:border-emerald-600";
  const label = "mb-1 block text-xs font-medium text-stone-600";

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-4xl">Submit anonymously</h1>
      <p className="mt-3 text-sm text-stone-600">
        No account needed — contact details are optional and never required. Every submission is
        screened automatically, then reviewed by a human before publishing. Nothing auto-publishes.
      </p>

      <div className="mt-6 flex gap-2">
        {(["food", "brand", "price"] as Kind[]).map((k) => (
          <button key={k} onClick={() => { setKind(k); setStatus(null); }}
            className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${kind === k ? "border-emerald-600 bg-emerald-100 text-emerald-700" : "border-stone-200 text-stone-600 hover:bg-stone-100"}`}>
            {k === "price" ? "price" : `${k} / product`}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="card mt-4 space-y-4 p-6">
        {/* Honeypot: invisible to humans, irresistible to bots. Filled = silent drop. */}
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true"
          className="pointer-events-none absolute h-px w-px opacity-0" />
        {kind !== "price" && (
          <>
            <div>
              <label className={label} htmlFor="name">{kind === "food" ? "Food name" : "Brand + product name"}</label>
              <input id="name" name="name" required maxLength={200} className={input} placeholder={kind === "food" ? "e.g. wholemeal pitta bread" : "e.g. Biona organic rye bread"} />
            </div>
            <div>
              <label className={label} htmlFor="category">Category</label>
              <select id="category" name="category" className={input} defaultValue="">
                <option value="" disabled>Choose…</option>
                <option value="base">Base (bread, grains, potatoes)</option>
                <option value="protein">Protein</option>
                <option value="veg">Vegetables</option>
                <option value="extra">Fruit / extras</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor="claimed_folic_acid_status">Folic-acid claim</label>
              <select id="claimed_folic_acid_status" name="claimed_folic_acid_status" className={input} defaultValue="">
                <option value="" disabled>Choose…</option>
                <option value="confirmed_clean">No added folic acid (label shows no fortification)</option>
                <option value="confirmed_added">Contains added folic acid</option>
                <option value="needs_review">Not sure — needs checking</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor="barcode">Barcode (EAN) — optional, enables photo &amp; label lookup</label>
              <input id="barcode" name="barcode" inputMode="numeric" maxLength={14} className={input} placeholder="e.g. 5010029000104" />
            </div>
            <div>
              <label className={label} htmlFor="source_link_or_note">Source (link or note) — helps verification</label>
              <input id="source_link_or_note" name="source_link_or_note" maxLength={500} className={input} placeholder="e.g. packaging photo 09/26, or link to ingredients" />
            </div>
          </>
        )}
        {kind === "price" && (
          <>
            <div>
              <label className={label} htmlFor="name">Which food?</label>
              <input id="name" name="name" required maxLength={200} className={input} placeholder="e.g. wholemeal-bread" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={label} htmlFor="retailer">Retailer</label>
                <select id="retailer" name="retailer" className={input} defaultValue="ASDA">
                  <option>ASDA</option><option>Tesco</option><option>Sainsbury&apos;s</option><option>Other</option>
                </select>
              </div>
              <div>
                <label className={label} htmlFor="price_gbp">Price (£)</label>
                <input id="price_gbp" name="price_gbp" type="number" step="0.01" min="0.01" required className={input} placeholder="0.90" />
              </div>
              <div>
                <label className={label} htmlFor="pack_size_g">Pack size (g)</label>
                <input id="pack_size_g" name="pack_size_g" type="number" step="1" min="1" required className={input} placeholder="800" />
              </div>
            </div>
          </>
        )}
        <button disabled={busy} className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50">
          {busy ? "Screening…" : "Submit anonymously"}
        </button>
        {status && <p className={`text-sm ${status.ok ? "text-emerald-700" : "text-red-700"}`}>{status.msg}</p>}
      </form>
    </main>
  );
}
