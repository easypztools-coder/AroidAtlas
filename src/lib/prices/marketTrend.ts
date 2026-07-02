import { PriceHistoryPoint } from "./types";
import { percentile } from "./percentile";

export interface TrendResult {
  changePercent: number;
  status: "Rising" | "Declining" | "Stable";
}

const RISE_THRESHOLD_PCT = 10;
const RECENT_WEEKS = 3;

/**
 * Compare the median of the most recent RECENT_WEEKS weekly buckets against
 * the median of everything before them. This is what "threeMonthChangePercent"
 * / marketStatus actually measure — a rolling recent-vs-prior comparison
 * rather than a fixed calendar cutoff, since sample density varies a lot
 * between fast- and slow-moving rare aroids.
 */
export function computeMarketTrend(weeklyPoints: PriceHistoryPoint[]): TrendResult | null {
  if (weeklyPoints.length < RECENT_WEEKS + 1) return null;

  const recent = weeklyPoints.slice(-RECENT_WEEKS);
  const older = weeklyPoints.slice(0, weeklyPoints.length - RECENT_WEEKS);
  if (older.length === 0) return null;

  const recentMedian = recent.reduce((s, p) => s + p.median, 0) / recent.length;
  const olderMedian = older.reduce((s, p) => s + p.median, 0) / older.length;
  if (olderMedian === 0) return null;

  const changePercent = ((recentMedian - olderMedian) / olderMedian) * 100;
  const status: TrendResult["status"] =
    changePercent > RISE_THRESHOLD_PCT ? "Rising" : changePercent < -RISE_THRESHOLD_PCT ? "Declining" : "Stable";

  return { changePercent, status };
}

/** Group raw sold listings into weekly median/percentile buckets, chronologically sorted. */
export function bucketListingsByWeek(
  items: { soldDate: string | null; price: number }[]
): PriceHistoryPoint[] {
  const weeks: Record<string, number[]> = {};
  for (const item of items) {
    if (!item.soldDate || item.price <= 0) continue;
    const weekKey = getISOWeekKey(item.soldDate);
    if (!weeks[weekKey]) weeks[weekKey] = [];
    weeks[weekKey].push(item.price);
  }

  const points: PriceHistoryPoint[] = [];
  for (const [weekKey, prices] of Object.entries(weeks).sort()) {
    const sorted = [...prices].sort((a, b) => a - b);
    const n = sorted.length;
    // Skip singleton weeks — a single sale cannot form a meaningful distribution.
    if (n < 2) continue;

    points.push({
      date: isoWeekToMidDate(weekKey),
      median: percentile(sorted, 50),
      p25: percentile(sorted, 25),
      p75: percentile(sorted, 75),
      min: sorted[0],
      max: sorted[n - 1],
      sampleSize: n,
      confidenceScore: n >= 30 ? "A" : n >= 15 ? "B" : n >= 5 ? "C" : "D",
    });
  }
  return points;
}

/**
 * Fetch the full deduplicated sold-listing history for a plant from Postgres.
 * Takes the db client as a parameter instead of importing @/lib/db directly,
 * so this module stays usable from both Next.js routes and the tsx CLI
 * script (which doesn't resolve the @/ path alias).
 */
export async function loadListingHistoryForTrend(
  db: { query: (sql: string, params?: unknown[]) => Promise<{ rows: Array<{ total_price: string; sold_date: string | Date | null }> }> },
  slug: string
): Promise<{ soldDate: string | null; price: number }[]> {
  const res = await db.query(
    `SELECT DISTINCT ON (
       CASE WHEN url <> '' THEN url ELSE plant_slug || '|' || title || '|' || COALESCE(sold_date::text, '') END
     ) total_price, sold_date
     FROM ebay_price_listings
     WHERE plant_slug = $1
     ORDER BY
       CASE WHEN url <> '' THEN url ELSE plant_slug || '|' || title || '|' || COALESCE(sold_date::text, '') END,
       id ASC`,
    [slug]
  );
  return res.rows.map((r) => ({
    soldDate: r.sold_date ? new Date(r.sold_date).toISOString().slice(0, 10) : null,
    price: parseFloat(r.total_price),
  }));
}

function getISOWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

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

  const targetDate = new Date(week1Thursday);
  targetDate.setUTCDate(week1Thursday.getUTCDate() + (week - 1) * 7);

  return targetDate.toISOString();
}
