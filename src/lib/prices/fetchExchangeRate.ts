/**
 * Fetches the current USD → GBP rate from the Frankfurter API.
 * Free, no API key required. Falls back to a hardcoded rate if the
 * request fails or times out.
 */
export async function fetchUsdToGbpRate(): Promise<number> {
  try {
    const res = await fetch(
      "https://api.frankfurter.app/latest?from=USD&to=GBP",
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error(`Frankfurter returned ${res.status}`);
    const json = await res.json();
    const rate = json?.rates?.GBP;
    if (typeof rate === "number" && rate > 0) return rate;
    throw new Error("Unexpected response shape from Frankfurter");
  } catch (err) {
    // Fallback rate — update periodically. Last reviewed: 2026-06-27 (~0.79 mid-market).
    console.warn("[fetchExchangeRate] USD/GBP live fetch failed, using hardcoded fallback:", err);
    return 0.79;
  }
}
