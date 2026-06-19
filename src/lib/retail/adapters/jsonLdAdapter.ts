import * as cheerio from "cheerio";
import { ExtractedProduct, RetailerConfig } from "./types";
import { extractPotSizeCm } from "./shopifyJsonAdapter";

export async function jsonLdAdapter(
  retailer: RetailerConfig
): Promise<ExtractedProduct[]> {
  const products: ExtractedProduct[] = [];
  const checkedAt = new Date().toISOString();

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
    const scripts = $('script[type="application/ld+json"]');

    scripts.each((_, el) => {
      try {
        const text = $(el).text().trim();
        if (!text) return;
        const json = JSON.parse(text);

        // JSON-LD can be a single object, an array of objects, or @graph
        const objects = Array.isArray(json)
          ? json
          : json["@graph"]
          ? json["@graph"]
          : [json];

        for (const obj of objects) {
          if (!obj) continue;

          // Check if this object represents a product list or a single product
          if (obj["@type"] === "ItemList" && Array.isArray(obj.itemListElement)) {
            for (const element of obj.itemListElement) {
              if (element.item && element.item["@type"] === "Product") {
                parseProductObject(element.item, products, retailer, checkedAt);
              }
            }
          } else if (obj["@type"] === "Product") {
            parseProductObject(obj, products, retailer, checkedAt);
          }
        }
      } catch (err) {
        console.warn(`[jsonLdAdapter] Error parsing script block:`, err);
      }
    });
  } catch (err) {
    console.error(
      `[jsonLdAdapter] Error running adapter for ${retailer.name}:`,
      err instanceof Error ? err.message : String(err)
    );
    throw err;
  }

  return products;
}

function parseProductObject(
  obj: any,
  products: ExtractedProduct[],
  retailer: RetailerConfig,
  checkedAt: string
) {
  const title = obj.name;
  const productUrl = obj.url || retailer.url;

  if (!title) return;

  const offersObj = obj.offers;
  if (!offersObj) return;

  // offers can be a single offer or an array of offers
  const offersList = Array.isArray(offersObj)
    ? offersObj
    : offersObj.offers
    ? Array.isArray(offersObj.offers)
      ? offersObj.offers
      : [offersObj.offers]
    : [offersObj];

  for (const offer of offersList) {
    if (!offer) continue;

    const currency = offer.priceCurrency || "GBP";
    if (currency !== "GBP" && offer.priceCurrency !== "£") {
      continue;
    }

    const price = parseFloat(offer.price);
    if (isNaN(price)) continue;

    // Check availability
    const availText = offer.availability || "";
    const inStock =
      availText.includes("InStock") ||
      availText.includes("instock") ||
      availText.includes("In Store Only") ||
      availText.includes("OnlineOnly");

    const variantTitle = offer.sku || offer.name || undefined;
    const potSize = extractPotSizeCm(title);

    products.push({
      retailerSlug: retailer.slug,
      retailerName: retailer.name,
      title,
      productUrl,
      priceGbp: price,
      inStock,
      variantTitle: variantTitle !== title ? variantTitle : undefined,
      potSizeCm: potSize,
      sourceMethod: "jsonld",
      checkedAt,
    });
  }
}
