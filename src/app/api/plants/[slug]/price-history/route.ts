import { NextRequest, NextResponse } from "next/server";
import { loadLatestSnapshot } from "@/lib/prices/database";
import { PriceHistoryResponse, PriceHistoryPoint } from "@/lib/prices/types";

/**
 * ─── PUBLIC PRICE HISTORY ─────────────────────────────────────────────────
 *
 * Read-only endpoint: /api/plants/[slug]/price-history
 *
 * Groups individual eBay sold listings by month to create a trend.
 * Each listing has a soldDate — we bucket them by month and calculate
 * median/p25/p75 per bucket.
 *
 * Never calls SoldComps. Safe for public consumption.
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  const snapshot = await loadLatestSnapshot(slug);

  if (!snapshot) {
    return NextResponse.json(
      {
        slug,
        history: [],
        message: "No price data available yet. Run the admin update endpoint first.",
      },
      { status: 200 }
    );
  }

  // ─── Group listings by month using their soldDate ─────────────────────
  // Each listing has a real sale date from eBay.
  // We bucket: "2026-01" → [prices...], "2026-02" → [prices...]
  const months: Record<string, number[]> = {};

  if (snapshot.listings && snapshot.listings.length > 0) {
    for (const listing of snapshot.listings) {
      if (!listing.soldDate) continue;
      const soldPrice = listing.totalPrice ?? listing.soldPrice ?? 0;
      if (soldPrice <= 0) continue;
      // Extract YYYY-MM from the sold date
      const monthKey = listing.soldDate.substring(0, 7); // "2026-01"
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(soldPrice);
    }
  }

  // If no individual listings with dates, fall back to the aggregate snapshot
  const history: PriceHistoryPoint[] = [];

  if (Object.keys(months).length > 0) {
    // Build a trend point for each month
    for (const [monthKey, prices] of Object.entries(months).sort()) {
      const sorted = [...prices].sort((a, b) => a - b);
      const n = sorted.length;
      const min = sorted[0];
      const max = sorted[n - 1];
      const median = percentile(sorted, 50);
      const p25 = percentile(sorted, 25);
      const p75 = percentile(sorted, 75);

      // Confidence based on sample size
      const confidenceScore =
        n >= 30 ? "A" : n >= 15 ? "B" : n >= 5 ? "C" : "D";

      history.push({
        date: `${monthKey}-15T00:00:00.000Z`, // Mid-month date for charting
        median,
        p25,
        p75,
        min,
        max,
        sampleSize: n,
        confidenceScore,
      });
    }
  } else {
    // Fallback: use the single aggregate snapshot
    history.push({
      date: snapshot.snapshot.checkedAt,
      median: snapshot.snapshot.medianPrice,
      p25: snapshot.snapshot.p25Price,
      p75: snapshot.snapshot.p75Price,
      min: snapshot.snapshot.minPrice,
      max: snapshot.snapshot.maxPrice,
      sampleSize: snapshot.snapshot.acceptedCount,
      confidenceScore: snapshot.snapshot.confidenceScore,
    });
  }

  const response: PriceHistoryResponse = {
    slug,
    history,
  };

  return NextResponse.json(response);
}

// ─── Helper: calculate percentile from sorted array ──────────────────────
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const frac = index - lower;
  return sorted[lower] + frac * (sorted[upper] - sorted[lower]);
}