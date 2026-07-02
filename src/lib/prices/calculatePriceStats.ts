import { PriceStats, ConfidenceGrade } from "./types";
import { percentile } from "./percentile";
import { getListingRatio } from "./sizeRatios";

export interface PriceStatsInput {
  unitPrice: number;
  listingType: string;
  potSizeCm?: number;
  soldDate?: string | null;
}

const RECENCY_HALF_LIFE_DAYS = 45;
const STALE_DAYS_SOFT_CAP = 90; // beyond this, confidence can't exceed C
const STALE_DAYS_HARD_CAP = 180; // beyond this, confidence can't exceed D

const GRADE_RANK: Record<ConfidenceGrade, number> = { A: 4, B: 3, C: 2, D: 1 };

/**
 * Calculate robust, size-normalised price statistics from listings.
 *
 * Every unit price is first divided by its listing-type/pot-size ratio (see
 * sizeRatios.ts) so a sample skewed toward nodes one week and mature plants
 * the next doesn't read as a genuine price move — everything is expressed
 * as a 7cm-whole-plant equivalent before any statistics are computed.
 *
 * Pipeline:
 * 1. Normalise every unit price to its 7cm-whole-plant equivalent.
 * 2. IQR outlier removal (Q1 - 1.5*IQR .. Q3 + 1.5*IQR), skipped under 5 samples.
 * 3. Trim the top/bottom 10% of what's left when there's enough volume (n >= 10).
 * 4. Aggregate the surviving prices with a recency-weighted mean (half-life
 *    ~45 days) instead of a flat average, so the headline price tracks
 *    current momentum rather than being anchored by older sales.
 *
 * Confidence scoring:
 * - A: sampleSize >= 30, B: >= 15, C: >= 5, D: < 5
 * - Downgraded one grade if > 50% of results were rejected at the filter stage
 * - Downgraded one grade if > 30% of accepted prices were IQR outliers
 * - Capped at C if the most recent accepted sale is > 90 days old, capped at D
 *   if > 180 days — a large sample of stale sales shouldn't read as
 *   high-confidence "current" data.
 */
export function calculateStats(
  listings: PriceStatsInput[],
  totalRejectedCount: number
): PriceStats {
  // ─── Normalise to 7cm-equivalent price ──────────────────────────────────
  const priced = listings
    .map((l) => ({
      price: l.unitPrice / getListingRatio(l.listingType, l.potSizeCm),
      soldDate: l.soldDate ?? null,
    }))
    .filter((p) => p.price > 0 && !isNaN(p.price))
    .sort((a, b) => a.price - b.price);

  if (priced.length === 0) {
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

  const prices = priced.map((p) => p.price);
  const sampleSize = prices.length;
  const min = prices[0];
  const max = prices[prices.length - 1];
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;

  // ─── Percentiles ───────────────────────────────────────────────────────
  const p25 = percentile(prices, 25);
  const p75 = percentile(prices, 75);
  const iqr = p75 - p25;
  const median = percentile(prices, 50);

  // ─── Outlier detection (IQR method) ────────────────────────────────────
  let outlierCount = 0;
  let cleaned = priced;
  if (sampleSize >= 5) {
    const lowerBound = p25 - 1.5 * iqr;
    const upperBound = p75 + 1.5 * iqr;
    cleaned = priced.filter((p) => p.price >= lowerBound && p.price <= upperBound);
    outlierCount = priced.length - cleaned.length;
  }

  // ─── Trim top/bottom 10% when there's enough volume ────────────────────
  let trimmed = cleaned;
  if (cleaned.length >= 10) {
    const trimCount = Math.max(1, Math.floor(cleaned.length * 0.1));
    trimmed = cleaned.slice(trimCount, cleaned.length - trimCount);
  }

  // ─── Recency-weighted mean of the surviving set ────────────────────────
  let trimmedMean = mean;
  if (trimmed.length > 0) {
    const now = Date.now();
    const weights = trimmed.map((p) => recencyWeight(p.soldDate, now));
    const weightSum = weights.reduce((a, b) => a + b, 0);
    trimmedMean =
      weightSum > 0
        ? trimmed.reduce((s, p, i) => s + p.price * weights[i], 0) / weightSum
        : trimmed.reduce((s, p) => s + p.price, 0) / trimmed.length;
  }

  // ─── Confidence score ──────────────────────────────────────────────────
  let confidence: ConfidenceGrade = "D";
  if (sampleSize >= 30) confidence = "A";
  else if (sampleSize >= 15) confidence = "B";
  else if (sampleSize >= 5) confidence = "C";

  // Downgrade if more than 50% of results were rejected at filter stage
  const totalResults = sampleSize + totalRejectedCount;
  if (totalResults > 0 && totalRejectedCount / totalResults > 0.5) {
    confidence = confidence === "A" ? "B" : confidence === "B" ? "C" : "D";
  }

  // Downgrade if more than 30% of accepted prices were IQR outliers
  if (outlierCount > 0 && outlierCount / (sampleSize + outlierCount) > 0.3) {
    confidence = confidence === "A" ? "B" : confidence === "B" ? "C" : "D";
  }

  // Cap if the sample is stale — a big count of old sales isn't "current" data
  const mostRecentSaleAgeDays = latestSaleAgeDays(priced, Date.now());
  if (mostRecentSaleAgeDays !== null) {
    const cap: ConfidenceGrade | null =
      mostRecentSaleAgeDays > STALE_DAYS_HARD_CAP ? "D" : mostRecentSaleAgeDays > STALE_DAYS_SOFT_CAP ? "C" : null;
    if (cap && GRADE_RANK[cap] < GRADE_RANK[confidence]) confidence = cap;
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

/** Exponential recency weight, half-life ~45 days. Unknown dates get a neutral mid-weight. */
function recencyWeight(soldDate: string | null, now: number): number {
  if (!soldDate) return 0.5;
  const days = (now - new Date(soldDate).getTime()) / 86_400_000;
  if (!isFinite(days) || days < 0) return 0.5;
  return Math.pow(0.5, days / RECENCY_HALF_LIFE_DAYS);
}

function latestSaleAgeDays(
  priced: { price: number; soldDate: string | null }[],
  now: number
): number | null {
  let latest: number | null = null;
  for (const p of priced) {
    if (!p.soldDate) continue;
    const t = new Date(p.soldDate).getTime();
    if (isNaN(t)) continue;
    if (latest === null || t > latest) latest = t;
  }
  return latest === null ? null : (now - latest) / 86_400_000;
}
