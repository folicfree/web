// Fill specific stubborn gaps with targeted Commons searches (better terms).
import { writeFileSync, readFileSync } from "node:fs";

const outPath = "src/data/food-images.json";
const j = JSON.parse(readFileSync(outPath, "utf8"));
const targets = {
  "sourdough-wholemeal": "wholemeal sourdough bread",
  "seeded-wholemeal-bread": "seeded wholemeal bread sliced",
  "chapati-wholemeal": "chapati roti flatbread",
  "couscous-wholemeal-cooked": "couscous cooked",
  "wholemeal-pasta-cooked": "whole wheat penne pasta",
  "chicken-breast": "grilled chicken breast",
  "mayo": "mayonnaise jar",
  "red-lentil": "extra removed",
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function commons(term) {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(term)}&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json&origin=*`;
    const r = await fetch(url, { headers: { "User-Agent": "FolicFree/0.1 (folicfree.net)" }, signal: AbortSignal.timeout(12000) });
    const d = await r.json();
    const pages = d?.query?.pages ? Object.values(d.query.pages) : [];
    return pages.map((p) => p.imageinfo?.[0]?.thumburl).find((u) => u && /\.(jpe?g|png|webp)/i.test(u))?.split("?")[0] || null;
  } catch { return null; }
}

for (const [slug, term] of Object.entries(targets)) {
  if (term === "extra removed") continue;
  if (j[slug]) { console.log("skip (have)", slug); continue; }
  const u = await commons(term);
  if (u) { j[slug] = u; console.log("✓", slug, u.slice(0, 70)); }
  else console.log("· none", slug);
  await sleep(3000);
}
writeFileSync(outPath, JSON.stringify(j, null, 2));
console.log("total now", Object.keys(j).length);