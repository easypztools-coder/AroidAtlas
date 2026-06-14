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
 *   content/price-snapshots/{slug}/{timestamp}.json (optional, by workflow)
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

const BASE_DIR = path.join(process.cwd(), "content", "price-snapshots");
const GITHUB_RAW =
  "https://raw.githubusercontent.com/easypztools-coder/AriodAtlas/main/content/price-snapshots";

/**
 * Load the latest snapshot for a given plant slug.
 * Returns null if no snapshot exists.
 */
export async function loadLatestSnapshot(
  slug: string
): Promise<{ snapshot: PriceSnapshot; listings: PriceListing[] } | null> {
  // ─── Try local filesystem first ──────────────────────────────────────────
  try {
    const latestPath = path.join(BASE_DIR, slug, "latest.json");
    if (fs.existsSync(latestPath)) {
      const raw = fs.readFileSync(latestPath, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // Fall through to GitHub fallback
  }

  // ─── Fallback to GitHub raw URL ──────────────────────────────────────────
  try {
    const url = `${GITHUB_RAW}/${slug}/latest.json`;
    const response = await fetch(url);

    if (!response.ok) {
      console.warn(`[database] GitHub raw fetch failed: ${response.status} for ${url}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (err) {
    console.warn(
      `[database] GitHub raw fetch error for ${slug}: ${err instanceof Error ? err.message : String(err)}`
    );
    return null;
  }
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