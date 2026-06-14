import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { PriceTrackingConfig } from "@/lib/prices/types";
import { fetchSoldCompsRaw } from "@/lib/prices/soldcomps";
import { normaliseListing } from "@/lib/prices/normaliseListing";
import { filterPlantListings } from "@/lib/prices/filterPlantListings";
import { classifyListing } from "@/lib/prices/classifyPlantListing";
import { calculateStats } from "@/lib/prices/calculatePriceStats";

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
    const rawItems = await fetchSoldCompsRaw({ query: config.query });
    const normalised = rawItems.map(normaliseListing);
    const { accepted, rejected } = filterPlantListings(normalised, config);
    const classified = accepted.map(classifyListing);
    const stats = calculateStats(classified, rejected.length);

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

    // ─── Build per-listing data for trend aggregation ──────────────────
    const acceptedListings = classified.map((l) => ({
      soldPrice: l.soldPrice,
      totalPrice: l.totalPrice,
      soldDate: l.soldDate,
      listingType: l.listingType,
      currency: l.currency,
    }));

    // Build per-rejection breakdown for debugging
    const rejectionBreakdown: Record<string, string[]> = {};
    for (const r of rejected) {
      const key = r.reason.split(":")[0].trim();
      if (!rejectionBreakdown[key]) rejectionBreakdown[key] = [];
      if (rejectionBreakdown[key].length < 3) {
        rejectionBreakdown[key].push(r.listing.title);
      }
    }

    return NextResponse.json({
      success: true,
      snapshot,
      stats,
      acceptedListings, // ← individual listings with dates
      acceptedCount: classified.length,
      rejectedCount: rejected.length,
      rejectionBreakdown,
      sampleRejectedTitle: rejected.length > 0 ? rejected[0].listing.title : null,
      sampleRejectedReason: rejected.length > 0 ? rejected[0].reason : null,
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