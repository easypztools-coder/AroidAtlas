import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { loadLatestSnapshot, loadLatestSnapshotFromDb } from "@/lib/prices/database";
import { PriceHistoryResponse, PriceHistoryPoint } from "@/lib/prices/types";
import { extractPotSizeCm } from "@/lib/prices/classifyPlantListing";
import { bucketListingsByWeek } from "@/lib/prices/marketTrend";
import { calculateStats, PriceStatsInput } from "@/lib/prices/calculatePriceStats";

/**
 * ─── PUBLIC PRICE HISTORY ─────────────────────────────────────────────────
 *
 * Read-only endpoint: /api/plants/[slug]/price-history
 *
 * 1. Groups individual eBay sold listings by ISO week to create a trend.
 * 2. Returns a fairPurchasePrice from the shared calculateStats pipeline
 *    (size-normalised, IQR-cleaned, recency-weighted mean).
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
      return NextResponse.json({ ...embedded, isEstimate: true }, { status: 200 });
    }
    return NextResponse.json(
      {
        slug,
        history: [],
        fairPurchasePrice: null,
        isEstimate: false,
        message: "No price data available yet. Run the admin update endpoint first.",
      },
      { status: 200 }
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // 1. GROUP LISTINGS BY ISO WEEK
  // ════════════════════════════════════════════════════════════════════════

  const history: PriceHistoryPoint[] = bucketListingsByWeek(
    (snapshot.listings ?? []).map((l) => ({
      soldDate: l.soldDate,
      price: l.totalPrice ?? l.soldPrice ?? 0,
    }))
  );

  // If weekly bucketing produced no usable data points, fall back to the
  // snapshot aggregate as a single reference point.
  if (history.length === 0) {
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
  // 2. CALCULATE FAIR PURCHASE PRICE & NORMALISED AA PRICE
  // ════════════════════════════════════════════════════════════════════════
  //
  // Uses the same size-normalised, IQR-cleaned, recency-weighted calculation
  // that produces the persisted marketMetrics.currentMedianPriceGBP, so the
  // number shown here matches list/comparison pages instead of drifting from
  // a separately-tuned trim ratio.

  const listings = snapshot.listings ?? [];

  const statsInput: PriceStatsInput[] = listings.map((l) => ({
    unitPrice: l.unitPrice ?? l.totalPrice ?? l.soldPrice ?? 0,
    listingType: l.listingType ?? "unknown",
    potSizeCm: extractPotSizeCm(l.title),
    soldDate: l.soldDate,
  }));

  const canonicalStats = calculateStats(statsInput, 0);
  const fairPurchasePrice = canonicalStats.sampleSize > 0 ? canonicalStats.trimmedMean : null;
  // Both numbers are now derived from the same normalised calculation —
  // kept as two response fields for backward compatibility with callers.
  const normalizedAaPrice = fairPurchasePrice;

  const recentSales = listings
    .map((l) => ({
      title: l.title,
      soldPrice: l.soldPrice,
      totalPrice: l.totalPrice,
      soldDate: l.soldDate,
      currency: l.currency,
      url: l.url,
      listingType: l.listingType,
      lotSize: l.lotSize,
      condition: l.condition,
    }))
    .sort((a, b) => {
      const dateA = a.soldDate ? new Date(a.soldDate).getTime() : 0;
      const dateB = b.soldDate ? new Date(b.soldDate).getTime() : 0;
      return dateB - dateA;
    });

  const sampleCount = canonicalStats.sampleSize;
  const confidenceScore = canonicalStats.confidenceScore;

  const response: PriceHistoryResponse = {
    slug,
    history,
    fairPurchasePrice,
    normalizedAaPrice,
    recentSales,
    isEstimate: false,
    confidenceScore,
    sampleCount,
    aaSource: "ebay",
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
  const genera = ["alocasia", "anthurium", "begonia", "monstera", "philodendron", "other"];

  for (const genus of genera) {
    const filePath = path.join(plantsRoot, genus, `${slug}.json`);
    if (!fs.existsSync(filePath)) continue;

    try {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const staticHistory: Array<{ date: string; medianPriceGBP: number; dataPointsAnalyzed: number }> =
        data.priceHistory ?? [];
      const metrics = data.marketMetrics ?? {};

      if (staticHistory.length === 0 && !metrics.currentMedianPriceGBP) return null;

      // Collapse p25/p75 to median — we have no real spread data, and showing
      // fake ±20% bands would misrepresent the market. The chart band will be
      // invisible (zero height) which is honest for estimated data.
      const history: PriceHistoryPoint[] = staticHistory.map((p) => ({
        date: p.date,
        median: p.medianPriceGBP,
        p25: p.medianPriceGBP,
        p75: p.medianPriceGBP,
        min: p.medianPriceGBP,
        max: p.medianPriceGBP,
        sampleSize: p.dataPointsAnalyzed,
        confidenceScore: "D",
      }));

      // Use the most recent priceHistory entry as the fair price — it reflects
      // the current market better than the static currentMedianPriceGBP which
      // was set at content-authoring time and may be months out of date.
      const latestHistoryPrice =
        staticHistory.length > 0
          ? staticHistory[staticHistory.length - 1].medianPriceGBP
          : null;

      return {
        slug,
        history,
        fairPurchasePrice: latestHistoryPrice ?? metrics.currentMedianPriceGBP ?? null,
        recentSales: [],
      };
    } catch {
      return null;
    }
  }

  return null;
}

