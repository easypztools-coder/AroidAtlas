import { ExtractedProduct, RetailerConfig } from "./types";

export function extractPotSizeCm(text: string): number | undefined {
  const match = text.match(/(\d+(?:\.\d+)?)\s*cm\b/i);
  if (match) {
    const val = parseFloat(match[1]);
    if (!isNaN(val)) return val;
  }
  return undefined;
}

export async function shopifyJsonAdapter(
  retailer: RetailerConfig
): Promise<ExtractedProduct[]> {
  const products: ExtractedProduct[] = [];
  const checkedAt = new Date().toISOString();
  const baseUrl = retailer.url.replace(/\/$/, "");

  // Page looping for paginated products.json
  let page = 1;
  const limit = 250;
  const maxPages = 4; // Max 1000 items to avoid timeouts

  while (page <= maxPages) {
    const urlPath = retailer.config?.customPath || "/products.json";
    const url = `${baseUrl}${urlPath}?limit=${limit}&page=${page}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(15000), // 15s timeout
      });

      if (!response.ok) {
        console.warn(
          `[shopifyJson] Failed to fetch page ${page} for ${retailer.name}: ${response.status}`
        );
        break;
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.products) || data.products.length === 0) {
        break;
      }

      for (const item of data.products) {
        const title = item.title;
        const handle = item.handle;
        const productUrl = `${baseUrl}/products/${handle}`;

        if (!Array.isArray(item.variants)) continue;

        for (const variant of item.variants) {
          const price = parseFloat(variant.price);
          const originalPrice = variant.compare_at_price
            ? parseFloat(variant.compare_at_price)
            : undefined;

          if (isNaN(price)) continue;

          // Attempt to extract pot size from title or variant title
          const variantTitle = variant.title !== "Default Title" ? variant.title : undefined;
          const potSize =
            extractPotSizeCm(variant.title) || extractPotSizeCm(title);

          products.push({
            retailerSlug: retailer.slug,
            retailerName: retailer.name,
            title,
            productUrl,
            priceGbp: price,
            originalPriceGbp: originalPrice && originalPrice > price ? originalPrice : undefined,
            inStock: variant.available === true || variant.available === "true",
            variantTitle,
            potSizeCm: potSize,
            sourceMethod: "shopify_json",
            checkedAt,
          });
        }
      }

      // If we got fewer than limit products, we are at the end
      if (data.products.length < limit) {
        break;
      }

      page++;
    } catch (err) {
      console.error(
        `[shopifyJson] Error parsing page ${page} for ${retailer.name}:`,
        err instanceof Error ? err.message : String(err)
      );
      // Let it fail if first page fails, otherwise return what we have
      if (page === 1) throw err;
      break;
    }
  }

  return products;
}
