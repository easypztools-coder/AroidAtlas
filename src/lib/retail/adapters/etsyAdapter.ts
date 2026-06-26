/**
 * Etsy API v3 adapter — searches for active plant listings by species name.
 *
 * Requires ETSY_API_KEY in .env.local.
 * Get a free key at: https://www.etsy.com/developers/register
 *
 * Unlike the retailer adapters, this searches Etsy per-plant rather than
 * per-store. It is invoked from fetch-etsy-prices.ts, not the retailer pipeline.
 */

export interface EtsyListing {
  title: string;
  url: string;
  priceGbp: number;
  originalPriceGbp?: number;
  inStock: boolean;
  shopName: string;
  listingId: number;
}

const ETSY_API_BASE = "https://openapi.etsy.com/v3/application";

export async function searchEtsyListings(
  query: string,
  apiKey: string,
  maxResults = 25
): Promise<EtsyListing[]> {
  const params = new URLSearchParams({
    keywords: query,
    limit: String(maxResults),
    sort_on: "created",
    sort_order: "desc",
  });

  const url = `${ETSY_API_BASE}/listings/active?${params}`;

  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Etsy API error ${response.status}: ${await response.text()}`);
  }

  const data = await response.json() as { results?: any[] };
  if (!data.results) return [];

  const listings: EtsyListing[] = [];

  for (const item of data.results) {
    // Etsy price is { amount: 4500, divisor: 100, currency_code: "GBP" }
    const price = item.price;
    if (!price || price.currency_code !== "GBP") continue;

    const priceGbp = price.amount / price.divisor;
    if (isNaN(priceGbp) || priceGbp <= 0) continue;

    listings.push({
      title: item.title,
      url: item.url,
      priceGbp,
      inStock: item.quantity > 0,
      shopName: item.shop?.shop_name ?? "Unknown",
      listingId: item.listing_id,
    });
  }

  return listings;
}
