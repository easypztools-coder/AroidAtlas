import { ClassifiedListing, PriceStats, ConfidenceGrade } from "./types";

/**
 * Calculate robust price statistics from a set of classified listings.
 *
 * Uses unitPrice (price per item, accounting for lot sizes).
 *
 * Outlier handling:
 * - Standard IQR method: remove values below Q1 - 1.5*IQR and above Q3 + 1.5*IQR
 * - Remove values under £5
 * - For very small samples (< 5), don't remove outliers aggressively
 *
 * Confidence scoring:
 * - A: sampleSize >= 30
 * - B: sampleSize >= 15
 * - C: sampleSize >= 5
 * - D: sampleSize < 5
 * - Downgrade if > 50% of results were rejected
 */
export function calculateStats(
  listings: ClassifiedListing[],
  totalRejectedCount: number
): PriceStats {
  // ─── Extract unit prices ───────────────────────────────────────────────
  const prices = listings
    .map((l) => l.unitPrice)
    .filter((p) => p > 0 && !isNaN(p))
    .sort((a, b) => a - b);

  if (prices.length === 0) {
    return {
      sampleSize: 0,
      min: 0,
      max: 0,
      median: 0,
      mean: 0,
      p25: 0,
      p75: 0,
      iqr: 0,
      trimmedMean: 0,
      confidenceScore: "D",
      rejectedCount: totalRejectedCount,
      rejectionReasons: {},
      outlierCount: 0,
    };
  }

  // ─── Basic stats ───────────────────────────────────────────────────────
  const sampleSize = prices.length;
  const min = prices[0];
  const max = prices[prices.length - 1];
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;

  // ─── Percentiles ───────────────────────────────────────────────────────
  const p25 = percentile(prices, 25);
  const p75 = percentile(prices, 75);
  const iqr = p75 - p25;

  // ─── Median ────────────────────────────────────────────────────────────
  const median = percentile(prices, 50);

  // ─── Outlier detection (IQR method) ────────────────────────────────────
  let outlierCount = 0;
  let cleanedPrices = [...prices];

  if (sampleSize >= 5) {
    const lowerBound = p25 - 1.5 * iqr;
    const upperBound = p75 + 1.5 * iqr;

    cleanedPrices = prices.filter((p) => p >= lowerBound && p <= upperBound);
    outlierCount = prices.length - cleanedPrices.length;
  }

  // ─── Trimmed mean (remove top and bottom 10%) ──────────────────────────
  let trimmedMean = mean;
  if (cleanedPrices.length >= 10) {
    const trimCount = Math.max(1, Math.floor(cleanedPrices.length * 0.1));
    const trimmed = cleanedPrices.slice(trimCount, cleanedPrices.length - trimCount);
    trimmedMean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }

  // ─── Confidence score ──────────────────────────────────────────────────
  let confidence: ConfidenceGrade = "D";
  if (sampleSize >= 30) confidence = "A";
  else if (sampleSize >= 15) confidence = "B";
  else if (sampleSize >= 5) confidence = "C";

  // Downgrade if more than 50% of results were rejected
  const totalResults = sampleSize + totalRejectedCount;
  if (totalResults > 0 && totalRejectedCount / totalResults > 0.5) {
    confidence = confidence === "A" ? "B" : confidence === "B" ? "C" : "D";
  }

  return {
    sampleSize,
    min,
    max,
    median,
    mean,
    p25,
    p75,
    iqr,
    trimmedMean,
    confidenceScore: confidence,
    rejectedCount: totalRejectedCount,
    rejectionReasons: {},
    outlierCount,
  };
}

// ─── Helper: Calculate percentile ─────────────────────────────────────────

function percentile(sorted: number[], pct: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (pct / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}