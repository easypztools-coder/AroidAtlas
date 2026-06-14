import { SoldCompsRawItem, SoldCompsResponse } from "./types";

/**
 * ─── SOLDCOMPS API CALLER ──────────────────────────────────────────────────
 *
 * Fetches sold listings from the SoldComps API.
 *
 * Endpoint: GET https://api.sold-comps.com/v1/scrape
 * Auth:     Bearer token via SOLDCOMPS_API_KEY env var
 *
 * Process:
 * 1. Fetch raw data from API
 * 2. Parse response
 * 3. Filter to GBP/UK only
 * 4. Reject non-plant listings
 * 5. Return raw items for normalisation
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

const SOLDCOMPS_API_KEY = process.env.SOLDCOMPS_API_KEY;

if (!SOLDCOMPS_API_KEY) {
  console.warn(
    "[prices/soldcomps] SOLDCOMPS_API_KEY environment variable is not set. The price system will not function."
  );
}

/**
 * Fetch raw sold listings from SoldComps API.
 *
 * @param params.query - The search keyword (e.g. "Philodendron spiritus sancti")
 * @param params.maxResults - Max results to return (default 240)
 * @returns Array of raw SoldComps items
 */
export async function fetchSoldCompsRaw(
  params: { query: string; maxResults?: number }
): Promise<SoldCompsRawItem[]> {
  if (!SOLDCOMPS_API_KEY) {
    throw new Error(
      "[soldcomps] SOLDCOMPS_API_KEY is not set. Cannot fetch prices."
    );
  }

  const { query, maxResults = 240 } = params;

  // ─── Build URL ──────────────────────────────────────────────────────────
  const url = new URL("https://api.sold-comps.com/v1/scrape");
  url.searchParams.set("keyword", query);
  url.searchParams.set("count", String(maxResults));
  url.searchParams.set("page", "1");

  // ─── Fetch ──────────────────────────────────────────────────────────────
  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${SOLDCOMPS_API_KEY}`,
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    throw new Error(
      `[soldcomps] Network error fetching from SoldComps: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // ─── Error handling ────────────────────────────────────────────────────
  if (response.status === 401 || response.status === 403) {
    throw new Error(
      "[soldcomps] Invalid API key (401/403). Check SOLDCOMPS_API_KEY."
    );
  }

  if (response.status === 429) {
    throw new Error(
      "[soldcomps] Rate limited (429). Wait before retrying."
    );
  }

  if (response.status >= 500) {
    throw new Error(
      `[soldcomps] SoldComps API error (${response.status}). Server may be down.`
    );
  }

  if (!response.ok) {
    throw new Error(
      `[soldcomps] Unexpected status ${response.status}: ${response.statusText}`
    );
  }

  // ─── Parse response ─────────────────────────────────────────────────────
  let json: SoldCompsResponse;
  try {
    json = await response.json();
  } catch {
    throw new Error(
      "[soldcomps] Invalid JSON response from SoldComps API."
    );
  }

  // Validate shape
  if (!json || !Array.isArray(json.items)) {
    throw new Error(
      `[soldcomps] Unexpected response shape. Expected { items: [...] }, got ${typeof json}`
    );
  }

  // ─── Log diagnostics ────────────────────────────────────────────────────
  console.log(
    `[soldcomps] Fetched ${json.items.length} items for "${query}"`
  );

  // ─── Accept GBP items, also accept USD items (convert to GBP) ─────────
  // SoldComps primarily returns US eBay data. We keep USD listings and
  // convert to GBP (rough rate ~1 USD = 0.79 GBP).
  const USD_TO_GBP = 0.79;

  const acceptedItems = json.items
    .map((item) => {
      const currency = (item.soldCurrency ?? "GBP").toUpperCase();
      if (currency === "GBP") return item;
      if (currency === "USD") {
        // Convert price to GBP by applying exchange rate
        const priceNum = parseFloat(item.soldPrice?.replace(/[^0-9.\-]/g, "") || "0");
        const convertedPrice = (priceNum * USD_TO_GBP).toFixed(2);
        return { ...item, soldCurrency: "GBP", soldPrice: convertedPrice };
      }
      return null; // reject other currencies
    })
    .filter((item): item is SoldCompsRawItem => item !== null);

  console.log(
    `[soldcomps] ${acceptedItems.length} accepted (GBP + USD converted) out of ${json.items.length} total`
  );

  if (acceptedItems.length === 0) {
    console.warn(
      "[soldcomps] No accepted items found. Sample currencies:",
      json.items.slice(0, 5).map((i) => i.soldCurrency)
    );
  }

  // ─── Return accepted items ──────────────────────────────────────────────
  return acceptedItems;
}

/**
 * Validate that a raw item has the required fields.
 * Throws if soldPrice is missing, NaN, zero, or negative.
 */
export function validateRawItem(item: SoldCompsRawItem): void {
  if (!item.itemId) {
    throw new Error(`[soldcomps] Item missing itemId: ${JSON.stringify(item)}`);
  }
  if (!item.title) {
    throw new Error(`[soldcomps] Item missing title: ${JSON.stringify(item)}`);
  }
  if (!item.soldPrice || isNaN(parseFloat(item.soldPrice)) || parseFloat(item.soldPrice) <= 0) {
    throw new Error(
      `[soldcomps] Item "${item.title}" has invalid soldPrice: ${item.soldPrice}`
    );
  }
}