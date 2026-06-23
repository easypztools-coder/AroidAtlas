import fs from "fs";
import path from "path";
import { PriceSnapshot, PriceListing } from "./types";

const BASE_DIR = path.join(process.cwd(), "content", "price-snapshots");

/** Individual listing data saved alongside the snapshot for bucketing by month */
interface SavedListing {
  soldPrice: number;
  totalPrice: number;
  soldDate: string | null;
  listingType: string;
  currency: string;
  title?: string;
  url?: string;
}

/** Shape of the saved latest.json */
interface SavedData {
  snapshot: PriceSnapshot;
  stats?: Record<string, unknown>;
  acceptedListings?: SavedListing[];
  acceptedCount?: number;
  rejectedCount?: number;
}

type SnapshotResult = { snapshot: PriceSnapshot; listings: PriceListing[] };

/**
 * Load the latest eBay price snapshot from Postgres.
 * Returns null if the DB is unavailable or no snapshot exists for this slug.
 */
export async function loadLatestSnapshotFromDb(slug: string): Promise<SnapshotResult | null> {
  try {
    const { getDbPool } = await import("@/lib/db");
    const db = getDbPool();

    // Get the most recent snapshot for this plant
    const snapRes = await db.query(
      `SELECT id, plant_slug, source, marketplace, query, checked_at, currency,
              raw_result_count, accepted_count, rejected_count, outlier_count,
              confidence_score, min_price, p25_price, median_price, mean_price,
              trimmed_mean_price, p75_price, max_price, notes
       FROM ebay_price_snapshots
       WHERE plant_slug = $1
       ORDER BY checked_at DESC
       LIMIT 1`,
      [slug]
    );

    if (snapRes.rows.length === 0) return null;

    const row = snapRes.rows[0];
    const snapshot: PriceSnapshot = {
      id: String(row.id),
      plantSlug: row.plant_slug,
      source: row.source,
      marketplace: row.marketplace,
      query: row.query,
      checkedAt: row.checked_at instanceof Date ? row.checked_at.toISOString() : row.checked_at,
      currency: row.currency,
      rawResultCount: row.raw_result_count,
      acceptedCount: row.accepted_count,
      rejectedCount: row.rejected_count,
      outlierCount: row.outlier_count,
      confidenceScore: row.confidence_score,
      minPrice: parseFloat(row.min_price),
      p25Price: parseFloat(row.p25_price),
      medianPrice: parseFloat(row.median_price),
      meanPrice: parseFloat(row.mean_price),
      trimmedMeanPrice: parseFloat(row.trimmed_mean_price),
      p75Price: parseFloat(row.p75_price),
      maxPrice: parseFloat(row.max_price),
      notes: row.notes ?? "",
    };

    // Get the individual listings for this snapshot
    const listingsRes = await db.query(
      `SELECT title, listing_type, lot_size, sold_price, shipping_price,
              total_price, unit_price, currency, sold_date, url, seller, condition
       FROM ebay_price_listings
       WHERE snapshot_id = $1
       ORDER BY sold_date DESC`,
      [row.id]
    );

    const listings: PriceListing[] = listingsRes.rows.map((l) => ({
      plantSlug: slug,
      title: l.title,
      normalizedTitle: "",
      listingType: l.listing_type as import("./types").ListingType,
      lotSize: l.lot_size,
      soldPrice: parseFloat(l.sold_price),
      shippingPrice: parseFloat(l.shipping_price),
      totalPrice: parseFloat(l.total_price),
      unitPrice: parseFloat(l.unit_price),
      currency: l.currency,
      soldDate: l.sold_date ? (l.sold_date instanceof Date ? l.sold_date.toISOString().slice(0, 10) : String(l.sold_date).slice(0, 10)) : null,
      seller: l.seller ?? "",
      condition: l.condition ?? "",
      url: l.url,
      accepted: true,
      rejectionReason: null,
      isOutlier: false,
    }));

    return { snapshot, listings };
  } catch {
    // DB unavailable (local dev) or table doesn't exist yet — caller will fall back
    return null;
  }
}

/**
 * Load the latest snapshot for a given plant slug from the filesystem.
 * Returns null if no snapshot exists.
 */
export function loadLatestSnapshot(slug: string): SnapshotResult | null {
  let data: SavedData | null = null;

  try {
    const latestPath = path.join(BASE_DIR, slug, "latest.json");
    if (fs.existsSync(latestPath)) {
      data = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
    }
  } catch {
    // malformed snapshot
  }

  if (!data || !data.snapshot) return null;

  const listings: PriceListing[] = (data.acceptedListings ?? []).map(
    (l) => ({
      plantSlug: slug,
      title: l.title ?? "",
      normalizedTitle: "",
      listingType: l.listingType as import("./types").ListingType,
      lotSize: 1,
      soldPrice: l.soldPrice,
      shippingPrice: 0,
      totalPrice: l.totalPrice,
      unitPrice: l.totalPrice,
      currency: l.currency,
      soldDate: l.soldDate,
      seller: "",
      condition: "",
      url: l.url ?? "",
      accepted: true,
      rejectionReason: null,
      isOutlier: false,
    })
  );

  return { snapshot: data.snapshot, listings };
}

/**
 * List all snapshot timestamps for a given plant slug (filesystem only).
 */
export function listSnapshots(slug: string): string[] {
  try {
    const slugDir = path.join(BASE_DIR, slug);
    if (!fs.existsSync(slugDir)) return [];

    return fs
      .readdirSync(slugDir)
      .filter((f) => f.endsWith(".json") && f !== "latest.json")
      .map((f) => f.replace(".json", ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}
