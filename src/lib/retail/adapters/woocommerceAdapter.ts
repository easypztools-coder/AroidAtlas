import { ExtractedProduct, RetailerConfig } from "./types";
import { extractPotSizeCm } from "./shopifyJsonAdapter";

export async function woocommerceAdapter(
  retailer: RetailerConfig
): Promise<ExtractedProduct[]> {
  const products: ExtractedProduct[] = [];
  const checkedAt = new Date().toISOString();
  const baseUrl = retailer.url.replace(/\/$/, "");

  let page = 1;
  const perPage = 100;
  const maxPages = 4; // Max 400 products

  while (page <= maxPages) {
    const apiPath = retailer.config?.customPath || "/wp-json/wc/store/v1/products";
    const url = `${baseUrl}${apiPath}?per_page=${perPage}&page=${page}`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        console.warn(
          `[woocommerce] Failed to fetch page ${page} for ${retailer.name}: ${response.status}`
        );
        break;
      }

      const items = await response.json();
      if (!items || !Array.isArray(items) || items.length === 0) {
        break;
      }

      for (const item of items) {
        const title = item.name;
        const productUrl = item.permalink;

        // WooCommerce Store API returns prices in a prices object
        const prices = item.prices || {};
        const currency = prices.currency_code || "GBP";

        // Skip non-GBP listings
        if (currency !== "GBP" && prices.currency_symbol !== "£") {
          continue;
        }

        // Price is typically a string representing currency units, e.g. "1250" (12.50) or "12.50"
        let price = parseFloat(prices.price);
        if (isNaN(price)) continue;

        // If the API returns price in cents, divide by 100 (WooCommerce Store API usually returns it as a string with decimal, or sometimes in minor units)
        // Let's inspect the value. If it's something like "1200" and not "12.00", we divide.
        // Wait, typical wc store api returns price as an integer or string with digits, let's parse it safely:
        // WooCommerce Store API price values are returned as minor units (cents) if they don't have a decimal point.
        // Let's divide by 10**prices.currency_minor_unit (which is usually 2) or detect it.
        const minorUnit = typeof prices.currency_minor_unit === "number" ? prices.currency_minor_unit : 2;
        if (item.prices.price && !item.prices.price.includes(".")) {
          price = price / Math.pow(10, minorUnit);
        }

        let originalPrice = parseFloat(prices.regular_price);
        if (item.prices.regular_price && !item.prices.regular_price.includes(".")) {
          originalPrice = originalPrice / Math.pow(10, minorUnit);
        }

        const inStock = item.is_in_stock === true || item.add_to_cart?.is_in_stock === true;
        const potSize = extractPotSizeCm(title);

        products.push({
          retailerSlug: retailer.slug,
          retailerName: retailer.name,
          title,
          productUrl,
          priceGbp: price,
          originalPriceGbp: originalPrice && originalPrice > price ? originalPrice : undefined,
          inStock,
          potSizeCm: potSize,
          sourceMethod: "woocommerce",
          checkedAt,
        });
      }

      if (items.length < perPage) {
        break;
      }

      page++;
    } catch (err) {
      console.error(
        `[woocommerce] Error parsing page ${page} for ${retailer.name}:`,
        err instanceof Error ? err.message : String(err)
      );
      if (page === 1) throw err;
      break;
    }
  }

  return products;
}
