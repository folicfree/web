import { NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View } from "@react-pdf/renderer";
import React from "react";
import { decodeMeal } from "@/lib/share";
import { aggregate, gbp, badgeMeta } from "@/lib/nutrition";

// Stateless PDF export (Section 6.6): meal JSON in URL -> rendered -> streamed.
// Nothing is persisted server-side.

export const runtime = "nodejs";

const styles = {
  page: { paddingTop: 40, paddingHorizontal: 40, fontSize: 11, color: "#111" },
  brand: { fontSize: 20, marginBottom: 4, color: "#047857" },
  tagline: { fontSize: 9, color: "#666", marginBottom: 24 },
  h2: { fontSize: 13, marginBottom: 8, marginTop: 18 },
  row: { flexDirection: "row" as const, justifyContent: "space-between" as const, marginBottom: 6 },
  badge: { marginTop: 14, padding: 8, fontSize: 12, color: "#fff", alignSelf: "flex-start" as const },
  footnote: { marginTop: 24, fontSize: 8, color: "#888" },
};

function PdfDoc({ agg, meal }: { agg: ReturnType<typeof aggregate>; meal: ReturnType<typeof decodeMeal> }) {
  const badge = badgeMeta[agg.badge];
  const badgeColor = agg.badge === "clean" ? "#047857" : agg.badge === "review" ? "#b45309" : "#b91c1c";
  return (
    <Document title="FolicFree meal plan">
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>FolicFree</Text>
        <Text style={styles.tagline}>UK folic-acid food checker — folicfree.com</Text>
        <Text style={styles.h2}>Meal</Text>
        {agg.lines.map((l) => (
          <View key={l.food.slug} style={styles.row}>
            <Text>{l.food.name}</Text>
            <Text>{`${Math.round(l.grams)}g (${l.food.portionLabel})`}</Text>
          </View>
        ))}
        {meal && meal.portions !== 1 && <Text style={{ fontSize: 9, color: "#555" }}>Scaled x{meal.portions}</Text>}
        <Text style={styles.h2}>Nutrition (per meal)</Text>
        <View style={styles.row}><Text>Calories</Text><Text>{Math.round(agg.kcal)} kcal</Text></View>
        <View style={styles.row}><Text>Protein</Text><Text>{agg.protein.toFixed(1)} g</Text></View>
        <View style={styles.row}><Text>Carbs</Text><Text>{agg.carbs.toFixed(1)} g</Text></View>
        <View style={styles.row}><Text>Fat</Text><Text>{agg.fat.toFixed(1)} g</Text></View>
        <View style={styles.row}><Text>Fibre</Text><Text>{agg.fibre.toFixed(1)} g</Text></View>
        <View style={styles.row}><Text>Folate (natural)</Text><Text>{Math.round(agg.folate)} mcg</Text></View>
        <Text style={styles.h2}>Cost</Text>
        <View style={styles.row}><Text>Estimated total</Text><Text>{gbp(agg.cost)}</Text></View>
        <Text style={[styles.badge, { backgroundColor: badgeColor }]}>{badge.label}</Text>
        <Text style={styles.footnote}>
          Natural folate and added folic acid are tracked separately. Folic-acid flags reflect UK
          fortification rules (non-wholemeal wheat flour, mandatory from 13 Dec 2026). Costs are
          estimates from community-verified prices.
        </Text>
      </Page>
    </Document>
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const meal = decodeMeal(searchParams.get("m") || "");
  if (!meal || !meal.base) {
    return NextResponse.json({ error: "Missing or invalid meal code (?m=)." }, { status: 400 });
  }
  const agg = aggregate(meal);
  const buffer = await renderToBuffer(<PdfDoc agg={agg} meal={meal} />);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="folicfree-meal.pdf"',
    },
  });
}

