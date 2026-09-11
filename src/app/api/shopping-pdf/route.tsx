import { NextResponse } from "next/server";
import { renderToBuffer, Document, Page, Text, View } from "@react-pdf/renderer";
import React from "react";
import { getFood, type Food } from "@/data/foods";

// Stateless shopping-list PDF: slugs in the URL -> rendered -> streamed.
// Nothing persisted server-side (Section 6.6 pattern).

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slugs = (searchParams.get("s") || "").split(",").map((s) => s.trim()).filter(Boolean);
  const items = slugs.map((s) => getFood(s)).filter((f): f is Food => Boolean(f));
  if (items.length === 0) {
    return NextResponse.json({ error: "No valid items (?s=slug,slug)." }, { status: 400 });
  }
  const total = items.reduce((t, f) => t + (f.packPrice ?? (f.portionG * f.cost) / 100), 0);
  const buffer = await renderToBuffer(<ShopDoc items={items} total={total} />);
  return new NextResponse(new Uint8Array(buffer), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="folicfree-shopping-list.pdf"' },
  });
}

function ShopDoc({ items, total }: { items: Food[]; total: number }) {
  const row = { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid #eee" };
  return (
    <Document title="FolicFree shopping list">
      <Page size="A4" style={{ paddingTop: 40, paddingHorizontal: 40, fontSize: 11, color: "#111" }}>
        <Text style={{ fontSize: 20, marginBottom: 4, color: "#047857" }}>FolicFree — Shopping list</Text>
        <Text style={{ fontSize: 9, color: "#666", marginBottom: 20 }}>
          Every item is flagged free of added folic acid · {new Date().toLocaleDateString("en-GB")}
        </Text>
        {items.map((f) => (
          <View key={f.slug} style={row}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <View style={{ width: 12, height: 12, border: "1px solid #999", marginRight: 10 }} />
              <View>
                <Text>{f.name}</Text>
                <Text style={{ fontSize: 9, color: "#666" }}>{f.packG && f.packPrice ? `${f.packG}g pack` : f.portionLabel}</Text>
              </View>
            </View>
            <Text>{f.packPrice ? `£${f.packPrice.toFixed(2)}` : `~£${((f.portionG * f.cost) / 100).toFixed(2)}`}</Text>
          </View>
        ))}
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 16, fontSize: 13 }}>
          <Text style={{ fontWeight: 700 }}>Estimated total</Text>
          <Text style={{ fontWeight: 700 }}>£{total.toFixed(2)}</Text>
        </View>
        <Text style={{ marginTop: 24, fontSize: 8, color: "#888" }}>
          folicfree.com — prices are community estimates. Natural folate and added folic acid are tracked separately.
        </Text>
      </Page>
    </Document>
  );
}