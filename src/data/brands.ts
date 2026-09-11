// Sample brand directory entries. In production these live in the Supabase `brands`
// table (Section 3.7). NOTE: sample/illustrative data — verify before launch.
// sponsored_tier can only be "featured" | "native_suggestion" when
// verification_status === "confirmed_clean" (firewall rule, Section 3.8).

export type VerificationStatus = "confirmed_clean" | "needs_review" | "rejected";
export type SponsoredTier = "none" | "featured" | "native_suggestion";

export interface Brand {
  slug: string;
  brand_name: string;
  product_line: string;
  category: string;
  verification_status: VerificationStatus;
  source_note: string;
  where_to_buy_url: string;
  sponsored_tier: SponsoredTier;
  description: string;
  producer_url?: string; // producer's own site
}

export const brands: Brand[] = [
  {
    slug: "biona-organic-rye",
    brand_name: "Biona",
    product_line: "Organic Rye Bread",
    category: "base",
    verification_status: "confirmed_clean",
    source_note: "checked packaging 09/26 — rye flour, no fortification",
    where_to_buy_url: "https://www.example.com/biona-rye",
    producer_url: "https://www.biona.co.uk",
    sponsored_tier: "none",
    description:
      "A dense, German-style 100% rye loaf. Rye flour isn't covered by the UK wheat-flour fortification mandate, and Biona's label lists no added folic acid. More of a doorstep loaf than a sandwich bread, and pricier than supermarket wholemeal — but it keeps for days.",
  },
  {
    slug: "vogels-soy-linseed",
    brand_name: "Vogel's",
    product_line: "Soy & Linseed (Wholemeal)",
    category: "base",
    verification_status: "confirmed_clean",
    source_note: "checked packaging 09/26 — wholemeal wheat flour, exempt",
    where_to_buy_url: "https://www.example.com/vogels",
    producer_url: "https://www.vogelsbreads.co.uk",
    sponsored_tier: "none",
    description:
      "Wholemeal flour is exempt from the fortification mandate, and Vogel's soy & linseed builds on a wholemeal base with seeds for extra fibre. A like-for-like sandwich swap for standard white bread.",
  },
  {
    slug: "honest-bakery-sourdough",
    brand_name: "The Honest Bakery",
    product_line: "Wholemeal Sourdough",
    category: "base",
    verification_status: "needs_review",
    source_note: "claimed wholemeal-only — packaging check pending",
    where_to_buy_url: "",
    sponsored_tier: "none",
    description:
      "Awaiting packaging verification. White sourdoughs made with standard wheat flour are fortified like any other white bread; only wholemeal-based loaves are exempt.",
  },
  {
    slug: "schaefer-mahlzeit-rye",
    brand_name: "Schäfer Mahlzeit",
    product_line: "Pumpernickel",
    category: "base",
    verification_status: "confirmed_clean",
    source_note: "checked packaging 09/26 — whole rye only",
    where_to_buy_url: "https://www.example.com/pumpernickel",
    sponsored_tier: "featured",
    description:
      "Traditional pumpernickel: whole rye grain, baked long and slow. Almost no fat, very high fibre, and famously long shelf life. An acquired texture — slice it thin.",
  },
];
