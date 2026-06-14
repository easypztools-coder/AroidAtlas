import fs from "fs";
import path from "path";
import { PriceSnapshot, PriceListing } from "./types";

/**
 * ─── PRICE DATABASE ──────────────────────────────────────────────────────
 *
 * Storage layer for price snapshots.
 *
 * Uses /tmp (ephemeral, writable on Vercel serverless).
 * Snapshots persist within the same deployment but not across redeploys.
 * This is fine — the workflow fetches fresh data twice a week anyway.
 *
 * Structure:
 *   /tmp/price-snapshots/{slug}/{timestamp}.json
 *   /tmp/price-snapshots/{slug}/latest.json
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

const SNAPSHOTS_DIR = process.env.VERCEL
  ? "/tmp/price-snapshots"
  : path.join(process.cwd(), "content", "price-snapshots");

/**
 * Ensure the snapshots directory exists.
 */
function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Save a price snapshot to disk.
 */
export async function saveSnapshot(
  snapshot: PriceSnapshot,
  listings: PriceListing[]
): Promise<void> {
  const slugDir = path.join(SNAPSHOTS_DIR, snapshot.plantSlug);
  ensureDir(slugDir);

  const timestamp = snapshot.checkedAt.replace(/[:.]/g, "-");
  const data = JSON.stringify({ snapshot, listings }, null, 2);

  // Write timestamped file (historical record)
  fs.writeFileSync(path.join(slugDir, `${timestamp}.json`), data, "utf-8");

  // Overwrite latest.json (for quick reads)
  fs.writeFileSync(path.join(slugDir, "latest.json"), data, "utf-8");
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