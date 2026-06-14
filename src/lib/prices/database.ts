import { put, list, get } from "@vercel/blob";
import { PriceSnapshot, PriceListing } from "./types";

/**
 * ─── PRICE DATABASE ──────────────────────────────────────────────────────
 *
 * Storage layer for price snapshots.
 *
 * Uses Vercel Blob Storage — works on Vercel's serverless runtime.
 * In local dev, ensure BLOB_READ_WRITE_TOKEN is set in .env.local.
 *
 * Structure:
 *   price-snapshots/{slug}/{timestamp}.json
 *   price-snapshots/{slug}/latest.json
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

const BLOB_PREFIX = "price-snapshots";

/**
 * Save a price snapshot to Vercel Blob.
 */
export async function saveSnapshot(
  snapshot: PriceSnapshot,
  listings: PriceListing[]
): Promise<void> {
  const timestamp = snapshot.checkedAt.replace(/[:.]/g, "-");
  const data = JSON.stringify({ snapshot, listings }, null, 2);

  // Write timestamped file (historical record)
  await put(
    `${BLOB_PREFIX}/${snapshot.plantSlug}/${timestamp}.json`,
    data,
    { contentType: "application/json", access: "public" }
  );

  // Overwrite latest.json (for quick reads)
  await put(
    `${BLOB_PREFIX}/${snapshot.plantSlug}/latest.json`,
    data,
    { contentType: "application/json", access: "public" }
  );
}

/**
 * Load the latest snapshot for a given plant slug.
 * Returns null if no snapshot exists.
 */
export async function loadLatestSnapshot(
  slug: string
): Promise<{ snapshot: PriceSnapshot; listings: PriceListing[] } | null> {
  try {
    const result = await get(`${BLOB_PREFIX}/${slug}/latest.json`, {
      access: "public",
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;

    // Read the stream into a string
    const reader = result.stream.getReader();
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode(); // flush

    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * List all snapshot timestamps for a given plant slug.
 */
export async function listSnapshots(slug: string): Promise<string[]> {
  const prefix = `${BLOB_PREFIX}/${slug}/`;

  try {
    const { blobs } = await list({ prefix });
    return blobs
      .filter((b) => b.pathname.endsWith(".json") && !b.pathname.endsWith("latest.json"))
      .map((b) => b.pathname.replace(`${prefix}`, "").replace(".json", ""))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}