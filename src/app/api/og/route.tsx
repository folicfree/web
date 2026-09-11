import { ImageResponse } from "next/og";
import { decodeMeal } from "@/lib/share";
import { aggregate, gbp, badgeMeta } from "@/lib/nutrition";

// Auto-generated OG image per shared meal (Section 6.7).
// Meal state is decoded from the URL — nothing is persisted server-side.

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const meal = decodeMeal(searchParams.get("m") || "");
  const agg = meal ? aggregate(meal) : null;

  const badge = agg ? badgeMeta[agg.badge] : null;
  const items = agg ? agg.lines.map((l) => l.food.name) : [];
  const shown = items.slice(0, 6);
  const title = items.length
    ? `${items.slice(0, 3).join(" + ")}${items.length > 3 ? " …" : ""}`
    : "Find food without added folic acid";
  const badgeColor = agg?.badge === "clean" ? "#6ee7b7" : agg?.badge === "review" ? "#fcd34d" : "#fca5a5";
  const borderColor = agg?.badge === "clean" ? "#6ee7b755" : agg?.badge === "review" ? "#fcd34d55" : "#fca5a555";

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", background: "#0a0d0b", padding: 48, color: "#e7ede9", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", width: 16, height: 16, borderRadius: 8, background: "#34d399" }} />
          <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: "#34d399" }}>FolicFree</div>
          <div style={{ display: "flex", fontSize: 20, color: "#7a8a80", marginLeft: "auto" }}>UK folic-acid food checker</div>
        </div>
        <div style={{ display: "flex", fontSize: 44, fontWeight: 700, marginTop: 24, lineHeight: 1.15 }}>{title}</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: 24, fontSize: 26, color: "#b9c6be", gap: 8 }}>
          {shown.map((n) => (
            <div key={n} style={{ display: "flex" }}>{`· ${n}`}</div>
          ))}
        </div>
        <div style={{ display: "flex", marginTop: "auto", alignItems: "center", gap: 20 }}>
          {badge ? (
            <div style={{ display: "flex", padding: "10px 18px", borderRadius: 10, fontSize: 24, fontWeight: 700, border: `1px solid ${borderColor}`, color: badgeColor }}>
              {badge.label}
            </div>
          ) : (
            <div style={{ display: "flex", padding: "10px 18px", borderRadius: 10, fontSize: 24, fontWeight: 700, border: "1px solid #34d39955", color: "#6ee7b7" }}>
              No added folic acid
            </div>
          )}
          {agg ? (
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>{`${gbp(agg.cost)} per meal`}</div>
          ) : (
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>folicfree.com</div>
          )}
          {agg && <div style={{ display: "flex", fontSize: 24, color: "#7a8a80" }}>{`${Math.round(agg.kcal)} kcal`}</div>}
          <div style={{ display: "flex", fontSize: 20, color: "#7a8a80", marginLeft: "auto" }}>folicfree.com</div>
        </div>
        <div style={{ display: "flex", position: "absolute", bottom: 0, left: 0, width: "100%", height: 6, background: "#10b981" }} />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

