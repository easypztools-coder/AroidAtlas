import * as cheerio from "cheerio";
import { ExtractedProduct, RetailerConfig } from "./types";
import { extractPotSizeCm } from "./shopifyJsonAdapter";

export async function htmlAdapter(
  retailer: RetailerConfig
): Promise<ExtractedProduct[]> {
  const products: ExtractedProduct[] = [];
  const checkedAt = new Date().toISOString();
  const baseUrl = retailer.url.replace(/\/$/, "");

  const selectors = retailer.config?.selectors;
  if (!selectors || !selectors.container) {
    throw new Error(`Missing CSS selectors configuration for retailer: ${retailer.name}`);
  }

  try {
    const response = await fetch(retailer.url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const containers = $(selectors.container);

    containers.each((_, el) => {
      const card = $(el);

      // Extract title
      const title = selectors.title ? card.find(selectors.title).text().trim() : "";
      if (!title) return;

      // Extract URL
      let productUrl = selectors.link ? card.find(selectors.link).attr("href") || "" : "";
      if (!productUrl && card.is("a")) {
        productUrl = card.attr("href") || "";
      }
      if (!productUrl) return;

      if (!productUrl.startsWith("http")) {
        productUrl = `${baseUrl}${productUrl.startsWith("/") ? "" : "/"}${productUrl}`;
      }

      // Extract Price
      const priceText = selectors.price ? card.find(selectors.price).text().trim() : "";
      const price = parsePriceText(priceText);
      if (price === undefined || isNaN(price)) return;

      // Extract Original Price
      const originalPriceText = selectors.originalPrice
        ? card.find(selectors.originalPrice).text().trim()
        : "";
      const originalPrice = parsePriceText(originalPriceText);

      // Extract Stock Status
      let inStock = true;
      if (selectors.inStock) {
        const stockEl = card.find(selectors.inStock);
        if (stockEl.length === 0) {
          inStock = false;
        } else {
          const text = stockEl.text().toLowerCase();
          if (text.includes("out of stock") || text.includes("sold out")) {
            inStock = false;
          }
        }
      } else {
        // Fallback checks on general text
        const cardText = card.text().toLowerCase();
        if (cardText.includes("out of stock") || cardText.includes("sold out")) {
          inStock = false;
        }
      }

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
        sourceMethod: "html_selectors",
        checkedAt,
      });
    });
  } catch (err) {
    console.error(
      `[htmlAdapter] Error running adapter for ${retailer.name}:`,
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }

  return products;
}

function parsePriceText(text: string): number | undefined {
  if (!text) return undefined;
  // Extract digits and decimals, e.g. "£12.50" -> "12.50"
  const cleaned = text.replace(/[^\d.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? undefined : val;
}
