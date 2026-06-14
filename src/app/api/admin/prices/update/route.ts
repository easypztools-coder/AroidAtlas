import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { PriceTrackingConfig } from "@/lib/prices/types";
import { fetchSoldCompsRaw } from "@/lib/prices/soldcomps";
import { normaliseListing } from "@/lib/prices/normaliseListing";
import { filterPlantListings } from "@/lib/prices/filterPlantListings";
import { classifyListing } from "@/lib/prices/classifyPlantListing";
import { calculateStats } from "@/lib/prices/calculatePriceStats";
import { saveSnapshot } from "@/lib/prices/database";

/**
 * ─── ADMIN PRICE UPDATE ──────────────────────────────────────────────────
 *
 * Manual endpoint: /api/admin/prices/update?slug=spiritus-sancti&secret=...
 *
 * Process:
 * 1. Validate secret against ADMIN_PRICE_SECRET
 * 2. Load the plant JSON by slug
 * 3. Confirm priceTracking.enabled = true
 * 4. Call SoldComps
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

  // ─── Run pipeline ────────────────────────────────────────────────────────
  try {
    // 1. Fetch raw data
    const rawItems = await fetchSoldCompsRaw({ query: config.query });

    // 2. Normalise
    const normalised = rawItems.map(normaliseListing);

    // 3. Filter
    const { accepted, rejected } = filterPlantListings(normalised, config);

    // 4. Classify
    const classified = accepted.map(classifyListing);

    // 5. Calculate stats
    const stats = calculateStats(classified, rejected.length);

    // 6. Save snapshot
    const snapshot = {
      plantSlug: slug,
      source: config.source,
      marketplace: config.marketplace,
      query: config.query,
      checkedAt: new Date().toISOString(),
      currency: config.marketCurrency,
      rawResultCount: rawItems.length,
      acceptedCount: classified.length,
      rejectedCount: rejected.length,
      outlierCount: stats.outlierCount,
      confidenceScore: stats.confidenceScore,
      minPrice: stats.min,
      p25Price: stats.p25,
      medianPrice: stats.median,
      meanPrice: stats.mean,
      trimmedMeanPrice: stats.trimmedMean,
      p75Price: stats.p75,
      maxPrice: stats.max,
      notes: "",
    };

    // Map classified listings to PriceListing for storage
    const priceListings = classified.map((l) => ({
      plantSlug: slug,
      title: l.originalTitle,
      normalizedTitle: l.title,
      listingType: l.listingType,
      lotSize: l.lotSize,
      soldPrice: l.soldPrice,
      shippingPrice: l.shippingPrice,
      totalPrice: l.totalPrice,
      unitPrice: l.unitPrice,
      currency: l.currency,
      soldDate: l.soldDate,
      seller: l.seller,
      condition: l.condition,
      url: l.url,
      accepted: true,
      rejectionReason: null,
      isOutlier: false,
    }));

    await saveSnapshot(snapshot, priceListings);

    return NextResponse.json({
      success: true,
      snapshot,
      stats,
      acceptedCount: classified.length,
      rejectedCount: rejected.length,
      warnings: [],
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}