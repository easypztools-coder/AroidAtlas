import { ExtractedProduct, RetailerConfig } from "./types";
import { extractPotSizeCm } from "./shopifyJsonAdapter";

export async function shopifyStorefrontAdapter(
  retailer: RetailerConfig
): Promise<ExtractedProduct[]> {
  const products: ExtractedProduct[] = [];
  const checkedAt = new Date().toISOString();
  const baseUrl = retailer.url.replace(/\/$/, "");

  // Query search endpoint with aroid genera to get the most relevant items
  const query = "philodendron OR monstera OR alocasia OR anthurium";
  const url = `${baseUrl}/search.json?q=${encodeURIComponent(query)}&type=product`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Shopify Storefront search returned status: ${response.status}`);
    }

    const data = await response.json();
    // Shopify search.json returns { results: [ { title, url, price, ... } ] }
    const items = data.results || data.products || [];

    if (!Array.isArray(items)) {
      return [];
    }

    for (const item of items) {
      const title = item.title;
      // Resolve absolute URL
      let productUrl = item.url || `/products/${item.handle}`;
      if (!productUrl.startsWith("http")) {
        productUrl = `${baseUrl}${productUrl.startsWith("/") ? "" : "/"}${productUrl}`;
      }

      // Storefront results usually represent a single product or have a nested variants list
      const price = typeof item.price === "number" ? item.price / 100 : parseFloat(item.price);
      if (isNaN(price)) continue;

      const inStock = item.available !== false;
      const potSize = extractPotSizeCm(title);

      products.push({
        retailerSlug: retailer.slug,
        retailerName: retailer.name,
        title,
        productUrl,
        priceGbp: price,
        inStock,
        potSizeCm: potSize,
        sourceMethod: "shopify_storefront",
        checkedAt,
      });
    }
  } catch (err) {
    console.error(
      `[shopifyStorefront] Error running adapter for ${retailer.name}:`,
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }

  return products;
}
