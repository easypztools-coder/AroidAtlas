import fs from "fs";
import path from "path";
import { PriceSnapshot, PriceListing } from "./types";

/**
 * ─── PRICE DATABASE ──────────────────────────────────────────────────────
 *
 * Storage layer for price snapshots.
 *
 * First tries to read from the local filesystem (content/price-snapshots/).
 * Falls back to fetching from GitHub raw URL (for Vercel deployments
 * where the file hasn't been deployed yet but is committed to the repo).
 *
 * Structure:
 *   content/price-snapshots/{slug}/latest.json
 *
 * The latest.json stores:
 *   { snapshot: PriceSnapshot, stats: ..., acceptedListings: [...], ... }
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

const BASE_DIR = path.join(process.cwd(), "content", "price-snapshots");
const GITHUB_RAW =
  "https://raw.githubusercontent.com/easypztools-coder/AriodAtlas/main/content/price-snapshots";

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

/**
 * Load the latest snapshot for a given plant slug.
 * Returns null if no snapshot exists.
 */
export async function loadLatestSnapshot(
  slug: string
): Promise<{ snapshot: PriceSnapshot; listings: PriceListing[] } | null> {
  let data: SavedData | null = null;

  // ─── Try local filesystem first ──────────────────────────────────────────
  try {
    const latestPath = path.join(BASE_DIR, slug, "latest.json");
    if (fs.existsSync(latestPath)) {
      const raw = fs.readFileSync(latestPath, "utf-8");
      data = JSON.parse(raw);
    }
  } catch {
    // Fall through to GitHub fallback
  }

  // ─── Fallback to GitHub raw URL ──────────────────────────────────────────
  if (!data) {
    try {
      const url = `${GITHUB_RAW}/${slug}/latest.json`;
      const response = await fetch(url);
      if (response.ok) {
        data = await response.json();
      }
    } catch (err) {
      console.warn(
        `[database] GitHub raw fetch error for ${slug}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  if (!data || !data.snapshot) return null;

  // Map listings to the expected PriceListing shape
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
 * List all snapshot timestamps for a given plant slug.
 */
export async function listSnapshots(slug: string): Promise<string[]> {
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