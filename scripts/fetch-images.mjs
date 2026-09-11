// Rerunnable image pipeline: fills src/data/food-images.json with a real photo
// for EVERY food in the catalog.
//   1. Open Food Facts (free, ODbL) — best for branded products, matched by name.
//   2. Wikimedia Commons (free, CC-licensed photos) — fallback for generic whole
//      foods (broccoli, chicken breast, eggs…) that OFF covers poorly.
// Existing entries are preserved; rerun to fill the gaps. Rate-limits politely.
// Usage: node scripts/fetch-images.mjs

import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync(new URL("../src/data/foods.ts", import.meta.url), "utf8");
const slugs = [...src.matchAll(/^\s{2}\["([a-z0-9-]+)", "([^"]+)", "(base|protein|veg|sauce|extra)"/gm)]
  .map(([, slug, name]) => ({ slug, name }));

const outPath = new URL("../src/data/food-images.json", import.meta.url);
let out = {};
try { out = JSON.parse(readFileSync(outPath, "utf8")); } catch {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STOP = new Set(["cooked", "plain", "original", "white", "brown", "seed", "loaf", "pack", "fresh", "tin", "tinned", "cups"]);
const tokens = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));

function score(hit, name) {
  const hay = `${hit.product_name || ""} ${hit.brands || ""}`.toLowerCase();
  const words = tokens(name);
  if (!words.length) return 0;
  const found = words.filter((w) => hay.includes(w)).length;
  return found / words.length;
}

// --- Open Food Facts --------------------------------------------------------
async function offSearch(name) {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&fields=product_name,brands,image_front_url&json=1&page_size=10&tagtype_0=countries&tag_contains_0=contains&tag_0=united+kingdom`;
    const res = await fetch(url, { headers: { "User-Agent": "FolicFree/0.1 (folicfree.com)" }, signal: AbortSignal.timeout(12000) });
    const text = await res.text();
    if (!text.trim().startsWith("<")) {
      try { return JSON.parse(text); } catch { }
    }
  } catch { /* network / timeout */ }
  return null;
}

async function offImage(name) {
  const data = await offSearch(name);
  try {
    const withImages = (data && data.products || []).filter((p) => p.image_front_url);
    // Longer name = more tokens to cross-check; require proportion higher too.
    const best = withImages.map((p) => ({ p, s: score(p, name) })).sort((a, b) => b.s - a.s)[0];
    if (best && best.s >= 0.75) return best.p.image_front_url;
  } catch { }
  return null;
}

// --- Wikimedia Commons (fallback for whole foods) ---------------------------
async function commonsImage(name) {
  try {
    const search = name
      .replace(/\(cooked\)/gi, "")
      .replace(/\(tin[a-z]*.*\)/gi, "")
      .replace(/\b(pack|as sold|medium|large|small)\b/gi, "")
      .trim();
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(search + " food")}&gsrnamespace=6&gsrlimit=6&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`;
    const res = await fetch(url, { headers: { "User-Agent": "FolicFree/0.1 (folicfree.net)" }, signal: AbortSignal.timeout(12000) });
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data?.query?.pages ? Object.values(data.query.pages) : [];
    const img = pages
      .map((p) => p.imageinfo?.[0])
      .find((ii) => ii && ii.thumburl && /\.(jpe?g|png|webp)/i.test(ii.thumburl));
    return img ? img.thumburl : null;
  } catch { /* network / timeout */ }
  return null;
}

// --- Main -------------------------------------------------------------------
for (const { slug, name } of slugs) {
  if (out[slug]) { continue; } // already filled — keep it
  try {
    let img = await offImage(name);
    if (img) {
      out[slug] = img;
      console.log("✓", slug, "→ [OFF]");
    } else {
      img = await commonsImage(name);
      if (img) {
        out[slug] = img;
        console.log("✓", slug, "→ [Commons]");
      } else {
        console.log("· none:", slug, "–", name);
      }
    }
  } catch (e) {
    console.log("× error:", slug, e?.message);
  }
  await sleep(1200); // polite to both APIs
}

writeFileSync(outPath, JSON.stringify(out, null, 2));
const missing = slugs.filter((s) => !out[s.slug]).length;
console.log(`\nDone: ${Object.keys(out).length}/${slugs.length} images. ${missing} still missing.`);
