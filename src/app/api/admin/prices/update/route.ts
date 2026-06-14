import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { PriceTrackingConfig } from "@/lib/prices/types";

/**
 * ─── ADMIN PRICE UPDATE ──────────────────────────────────────────────────
 *
 * Manual endpoint: /api/admin/prices/update?slug=spiritus-sancti&secret=...
 *
 * Process:
 * 1. Validate secret against ADMIN_PRICE_SECRET
 * 2. Load the plant JSON by slug
 * 3. Confirm priceTracking.enabled = true
 * 4. Call SoldComps (via the TODO module)
 * 5. Normalise → Filter → Classify → Calculate stats
 * 6. Save snapshot
 * 7. Return results
 *
 * Safe for manual weekly use. Never called on page load.
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

const ADMIN_SECRET = process.env.ADMIN_PRICE_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const secret = searchParams.get("secret");

  // ─── Auth ──────────────────────────────────────────────────────────────
  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: "ADMIN_PRICE_SECRET not configured on server" },
      { status: 500 }
    );
  }

  if (!secret || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Invalid or missing secret" }, { status: 401 });
  }

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  // ─── Load plant data ────────────────────────────────────────────────────
  const plantPath = path.join(
    process.cwd(),
    "content",
    "plants",
    "philodendron",
    `${slug}.json`
  );

  if (!fs.existsSync(plantPath)) {
    return NextResponse.json({ error: `Plant "${slug}" not found` }, { status: 404 });
  }

  const plantData = JSON.parse(fs.readFileSync(plantPath, "utf-8"));
  const config: PriceTrackingConfig | undefined = plantData.priceTracking;

  if (!config || !config.enabled) {
    return NextResponse.json(
      { error: `Price tracking not enabled for "${slug}"` },
      { status: 400 }
    );
  }

  // ─── Fetch raw data ──────────────────────────────────────────────────────
  // @TODO: Replace with actual SoldComps call once the API is known
  // For now, return a clear message about what's needed
  return NextResponse.json({
    success: false,
    message: "SoldComps API not yet integrated. See @TODO in src/lib/prices/soldcomps.ts",
    warnings: [
      "The price system is fully built and ready. You just need to:",
      "1. Replace the fetch call in soldcomps.ts with the real SoldComps endpoint",
      "2. Run this endpoint: /api/admin/prices/update?slug=spiritus-sancti&secret=YOUR_SECRET",
      "3. The pipeline will then: fetch → normalise → filter → classify → calculate → save",
    ],
    config,
  });
}

/**
 * Full pipeline (for when the API is ready):
 *
 * async function runPipeline(slug: string, config: PriceTrackingConfig) {
 *   // 1. Fetch raw data
 *   const rawItems = await fetchSoldCompsRaw({ query: config.query });
 *
 *   // 2. Normalise
 *   const normalised = rawItems.map(normaliseListing);
 *
 *   // 3. Filter
 *   const { accepted, rejected } = filterPlantListings(normalised, config);
 *
 *   // 4. Classify
 *   const classified = accepted.map(classifyListing);
 *
 *   // 5. Calculate stats
 *   const stats = calculateStats(classified, rejected.length);
 *
 *   // 6. Save
 *   const snapshot = {
 *     plantSlug: slug,
 *     source: config.source,
 *     marketplace: config.marketplace,
 *     query: config.query,
 *     checkedAt: new Date().toISOString(),
 *     currency: config.marketCurrency,
 *     rawResultCount: rawItems.length,
 *     acceptedCount: classified.length,
 *     rejectedCount: rejected.length,
 *     outlierCount: stats.outlierCount,
 *     confidenceScore: stats.confidenceScore,
 *     minPrice: stats.min,
 *     p25Price: stats.p25,
 *     medianPrice: stats.median,
 *     meanPrice: stats.mean,
 *     trimmedMeanPrice: stats.trimmedMean,
 *     p75Price: stats.p75,
 *     maxPrice: stats.max,
 *     notes: "",
 *   };
 *
 *   await saveSnapshot(snapshot, classified);
 *
 *   return { snapshot, stats, accepted: classified, rejected };
 * }
 */