// Open Food Facts — free, openly licensed (ODbL) database of branded food
// products: barcodes, ingredients, nutrition, and product photos. Used to fill
// product images and label data; nothing here requires an API key.

const OFF = "https://world.openfoodfacts.org/api/v2/product";

export interface OFFProduct {
  image_front_url?: string;
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  image_ingredients_url?: string;
}

export async function fetchOFFProduct(barcode: string): Promise<OFFProduct | null> {
  if (!/^\d{6,14}$/.test(barcode)) return null;
  try {
    const res = await fetch(`${OFF}/${barcode}.json`, {
      headers: { "User-Agent": "FolicFree/0.1 (folicfree.com)" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data?.status !== 1) return null;
    return data.product as OFFProduct;
  } catch {
    return null;
  }
}
