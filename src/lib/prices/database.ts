import fs from "fs";
import path from "path";
import { PriceSnapshot, PriceListing } from "./types";

/**
 * ─── PRICE DATABASE ──────────────────────────────────────────────────────
 *
 * Storage layer for price snapshots.
 *
 * Current implementation: File-based JSON storage in content/price-snapshots/
 * This works immediately without needing a database setup.
 *
 * @TODO: When Postgres/Supabase/Neon is set up, replace this with:
 *   - A Prisma or Drizzle client
 *   - Or a Supabase query
 *   - The interface below stays the same
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

const SNAPSHOTS_DIR = path.join(process.cwd(), "content", "price-snapshots");

/**
 * Ensure the snapshots directory exists.
 */
function ensureDir() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
  }
}

/**
 * Save a price snapshot to disk.
 *
 * Creates:
 *   content/price-snapshots/{slug}/{timestamp}.json
 *   content/price-snapshots/{slug}/latest.json
 */
export async function saveSnapshot(
  snapshot: PriceSnapshot,
  listings: PriceListing[]
): Promise<void> {
  ensureDir();

  const slugDir = path.join(SNAPSHOTS_DIR, snapshot.plantSlug);
  if (!fs.existsSync(slugDir)) {
    fs.mkdirSync(slugDir, { recursive: true });
  }

  const timestamp = snapshot.checkedAt.replace(/[:.]/g, "-");
  const snapshotPath = path.join(slugDir, `${timestamp}.json`);
  const latestPath = path.join(slugDir, "latest.json");

  const data = {
    snapshot,
    listings,
  };

  // Write timestamped file (historical record)
  fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2), "utf-8");

  // Overwrite latest.json (for quick reads)
  fs.writeFileSync(latestPath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Load the latest snapshot for a given plant slug.
 * Returns null if no snapshot exists.
 */
export async function loadLatestSnapshot(
  slug: string
): Promise<{ snapshot: PriceSnapshot; listings: PriceListing[] } | null> {
  const latestPath = path.join(SNAPSHOTS_DIR, slug, "latest.json");

  if (!fs.existsSync(latestPath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(latestPath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * List all snapshot timestamps for a given plant slug.
 */
export async function listSnapshots(slug: string): Promise<string[]> {
  const slugDir = path.join(SNAPSHOTS_DIR, slug);

  if (!fs.existsSync(slugDir)) {
    return [];
  }

  return fs
    .readdirSync(slugDir)
    .filter((f) => f.endsWith(".json") && f !== "latest.json")
    .map((f) => f.replace(".json", ""))
    .sort()
    .reverse();
}