import { SoldCompsRawItem } from "./types";

/**
 * ─── SOLDCOMPS API CALLER ──────────────────────────────────────────────────
 *
 * @TODO: Replace this entire implementation with the actual SoldComps API call.
 *
 * Things I need from you:
 * 1. The actual API endpoint URL (e.g. https://api.sold-comps.com/v1/...)
 * 2. HTTP method (GET/POST)
 * 3. Authentication method (Header? Query param?)
 * 4. Request parameter names for:
 *    - keyword/search query
 *    - marketplace filter (eBay UK / ebay.co.uk)
 *    - date range / lookback window (we want 730 days / 2 years)
 *    - max results / page size (we want up to 240)
 *    - sort order (we want ended recently)
 * 5. The exact response JSON structure
 *
 * Once provided, I'll replace the fetch call and response parsing below.
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
 * @TODO: Replace the URL, headers, and parameter mapping with the real API.
 * The placeholder below uses a generic GET with Bearer token.
 */
export async function fetchSoldCompsRaw(
  _params: { query: string; maxResults?: number }
): Promise<SoldCompsRawItem[]> {
  void _params; // mark as used
  if (!SOLDCOMPS_API_KEY) {
    throw new Error("SOLDCOMPS_API_KEY is not set. Cannot fetch prices.");
  }

  // ─── @TODO: Replace with actual API endpoint and parameters ──────────
  // Example placeholder:
  //   const url = new URL("https://api.sold-comps.com/v1/scrape");
  //   url.searchParams.set("keyword", query);
  //   url.searchParams.set("marketplace", "ebay.co.uk");
  //   url.searchParams.set("soldWithinDays", "730");  // 2 years
  //   url.searchParams.set("maxResults", String(maxResults));
  //   url.searchParams.set("sort", "ended_recently");
  //
  //   const response = await fetch(url.toString(), {
  //     headers: { Authorization: `Bearer ${SOLDCOMPS_API_KEY}` },
  //   });

  throw new Error(
    "[soldcomps] Not yet implemented. See @TODO in src/lib/prices/soldcomps.ts"
  );

  // ─── Once you provide the real API shape, this will parse the response ──
  // const json: SoldCompsResponse = await response.json();
  // if (!response.ok) {
  //   throw new Error(`SoldComps API error: ${response.status} ${response.statusText}`);
  // }
  // return _extractItems(json);
}
