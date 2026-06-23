import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadLatestSnapshot, loadLatestSnapshotFromDb } from "@/lib/prices/database";
import { PriceHistoryResponse, PriceHistoryPoint } from "@/lib/prices/types";

/**
 * ─── PUBLIC PRICE HISTORY ─────────────────────────────────────────────────
 *
 * Read-only endpoint: /api/plants/[slug]/price-history
 *
 * 1. Groups individual eBay sold listings by ISO week to create a trend.
 * 2. Returns a fairPurchasePrice calculated from the latest snapshot
 *    (trimmed mean after removing top/bottom 20%, giving a "fair" guide price).
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

  // Priority: DB snapshot (live, always fresh) → filesystem snapshot (deploy-time bundle) → embedded JSON
  const snapshot = (await loadLatestSnapshotFromDb(slug)) ?? loadLatestSnapshot(slug);

  // ── Fallback: read embedded priceHistory from plant JSON ──────────────────
  if (!snapshot) {
    const embedded = loadEmbeddedPriceHistory(slug);
    if (embedded) {
      return NextResponse.json(embedded, { status: 200 });
    }
    return NextResponse.json(
      {
        slug,
        history: [],
        fairPurchasePrice: null,
        message: "No price data available yet. Run the admin update endpoint first.",
      },
      { status: 200 }
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // 1. GROUP LISTINGS BY ISO WEEK
  // ════════════════════════════════════════════════════════════════════════

  const weeks: Record<string, number[]> = {};

  if (snapshot.listings && snapshot.listings.length > 0) {
    for (const listing of snapshot.listings) {
      if (!listing.soldDate) continue;
      const soldPrice = listing.totalPrice ?? listing.soldPrice ?? 0;
      if (soldPrice <= 0) continue;

      // Extract ISO week key from the sold date
      const weekKey = getISOWeekKey(listing.soldDate);
      if (!weeks[weekKey]) weeks[weekKey] = [];
      weeks[weekKey].push(soldPrice);
    }
  }

  const history: PriceHistoryPoint[] = [];

  if (Object.keys(weeks).length > 0) {
    for (const [weekKey, prices] of Object.entries(weeks).sort()) {
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
        date: isoWeekToMidDate(weekKey),
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

  // ════════════════════════════════════════════════════════════════════════
  // 2. CALCULATE FAIR PURCHASE PRICE
  // ════════════════════════════════════════════════════════════════════════
  //
  // Take all accepted listings from the latest snapshot.
  // Remove top & bottom 20% (outliers), then calculate trimmed mean.
  // This gives a "fair" price you'd expect to pay today.

  const allPrices: number[] = (snapshot.listings ?? [])
    .map((l) => l.totalPrice ?? l.soldPrice ?? 0)
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const fairPurchasePrice = calculateTrimmedMean(allPrices, 0.2);

  const recentSales = (snapshot.listings ?? [])
    .map((l) => ({
      title: l.title,
      soldPrice: l.soldPrice,
      totalPrice: l.totalPrice,
      soldDate: l.soldDate,
      currency: l.currency,
      url: l.url,
    }))
    .sort((a, b) => {
      const dateA = a.soldDate ? new Date(a.soldDate).getTime() : 0;
      const dateB = b.soldDate ? new Date(b.soldDate).getTime() : 0;
      return dateB - dateA;
    });

  const response: PriceHistoryResponse = {
    slug,
    history,
    fairPurchasePrice,
    recentSales,
  };

  return NextResponse.json(response);
}

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reads the embedded `priceHistory` array and `marketMetrics` from the plant
 * JSON and converts them to the standard PriceHistoryResponse shape.
 * Used as a fallback when no SoldComps snapshot exists for this slug yet.
 */
function loadEmbeddedPriceHistory(slug: string): PriceHistoryResponse | null {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  const genera = ["alocasia", "anthurium", "monstera", "philodendron", "other"];

  for (const genus of genera) {
    const filePath = path.join(plantsRoot, genus, `${slug}.json`);
    if (!fs.existsSync(filePath)) continue;

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const staticHistory: Array<{ date: string; medianPriceGBP: number; dataPointsAnalyzed: number }> =
        data.priceHistory ?? [];
      const metrics = data.marketMetrics ?? {};

      if (staticHistory.length === 0 && !metrics.currentMedianPriceGBP) return null;

      const history: PriceHistoryPoint[] = staticHistory.map((p) => ({
        date: p.date,
        median: p.medianPriceGBP,
        p25: p.medianPriceGBP * 0.8,
        p75: p.medianPriceGBP * 1.2,
        min: p.medianPriceGBP * 0.6,
        max: p.medianPriceGBP * 1.5,
        sampleSize: p.dataPointsAnalyzed,
        confidenceScore: "D",
      }));

      return {
        slug,
        history,
        fairPurchasePrice: metrics.currentMedianPriceGBP ?? null,
        recentSales: [],
      };
    } catch {
      return null;
    }
  }

  return null;
}

/** Calculate percentile from sorted array */
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

/**
 * Calculate trimmed mean: remove the top and bottom `trimRatio` fraction
 * of values, then average the rest.
 */
function calculateTrimmedMean(
  sorted: number[],
  trimRatio: number
): number | null {
  if (sorted.length === 0) return null;
  if (sorted.length < 5) {
    // Too few data points — just use regular mean
    return sorted.reduce((a, b) => a + b, 0) / sorted.length;
  }

  const trimCount = Math.floor(sorted.length * trimRatio);
  const trimmed = sorted.slice(trimCount, sorted.length - trimCount);

  if (trimmed.length === 0) return sorted.reduce((a, b) => a + b, 0) / sorted.length;

  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

/**
 * Get an ISO week key from a date string.
 * Returns format like "2026-W22".
 */
function getISOWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Convert an ISO week key ("2026-W22") to a mid-week ISO date string
 * for charting (the Thursday of that week).
 */
function isoWeekToMidDate(weekKey: string): string {
  const [yearStr, weekStr] = weekKey.split("-W");
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // Jan 4 is always in week 1 of the ISO calendar
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const daysToThursday = 4 - dayOfWeek;
  const week1Thursday = new Date(jan4);
  week1Thursday.setUTCDate(jan4.getUTCDate() + daysToThursday);

  // Add weeks
  const targetDate = new Date(week1Thursday);
  targetDate.setUTCDate(week1Thursday.getUTCDate() + (week - 1) * 7);

  return targetDate.toISOString();
}