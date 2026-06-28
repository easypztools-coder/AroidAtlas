import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import type { PriceTrackingConfig } from "@/lib/prices/types";
import { fetchSoldCompsRaw } from "@/lib/prices/soldcomps";
import { normaliseListing } from "@/lib/prices/normaliseListing";
import { filterPlantListings } from "@/lib/prices/filterPlantListings";
import { classifyListing } from "@/lib/prices/classifyPlantListing";
import { calculateStats } from "@/lib/prices/calculatePriceStats";
import { fetchUsdToGbpRate } from "@/lib/prices/fetchExchangeRate";
import { getDbPool } from "@/lib/db";

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
    // No slug = run all plants via the batch endpoint
    const batchUrl = new URL("/api/cron/update-ebay-prices", request.url);
    batchUrl.searchParams.set("secret", secret!);
    const batchRes = await fetch(batchUrl.toString());
    const batchJson = await batchRes.json();
    return NextResponse.json(batchJson, { status: batchRes.status });
  }

  // ─── Load plant data ────────────────────────────────────────────────────
  const genera = ["philodendron", "monstera", "alocasia", "anthurium", "begonia", "other"];
  let plantPath: string | null = null;
  for (const genus of genera) {
    const candidate = path.join(process.cwd(), "content", "plants", genus, `${slug}.json`);
    if (fs.existsSync(candidate)) { plantPath = candidate; break; }
  }

  if (!plantPath) {
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

  // ─── Fetch live USD/GBP rate ────────────────────────────────────────────
  const usdToGbpRate = await fetchUsdToGbpRate();

  // ─── Run pipeline ────────────────────────────────────────────────────────
  try {
    const rawItems = await fetchSoldCompsRaw({ query: config.query, marketplace: config.marketplace });
    const normalised = rawItems.map((item) => normaliseListing(item, usdToGbpRate));
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

    const acceptedListings = classified.map((l) => ({
      title: l.originalTitle,
      url: l.url,
      soldPrice: l.soldPrice,
      totalPrice: l.totalPrice,
      soldDate: l.soldDate,
      listingType: l.listingType,
      lotSize: l.lotSize,
      currency: l.currency,
    }));

    const rejectionBreakdown: Record<string, string[]> = {};
    for (const r of rejected) {
      const key = r.reason.split(":")[0].trim();
      if (!rejectionBreakdown[key]) rejectionBreakdown[key] = [];
      if (rejectionBreakdown[key].length < 3) {
        rejectionBreakdown[key].push(r.listing.title);
      }
    }

    // ─── Persist to Postgres ───────────────────────────────────────────────
    // Self-migrating: creates tables if they don't exist.
    // Wrapped in try/catch so local dev without DB still gets the API response.
    let snapshotId: number | null = null;
    try {
      const db = getDbPool();

      await db.query(`
        CREATE TABLE IF NOT EXISTS ebay_price_snapshots (
          id SERIAL PRIMARY KEY,
          plant_slug VARCHAR(255) NOT NULL,
          source VARCHAR(50) NOT NULL DEFAULT 'soldcomps',
          marketplace VARCHAR(100) NOT NULL,
          query TEXT NOT NULL,
          checked_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
          currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
          raw_result_count INTEGER NOT NULL DEFAULT 0,
          accepted_count INTEGER NOT NULL DEFAULT 0,
          rejected_count INTEGER NOT NULL DEFAULT 0,
          outlier_count INTEGER NOT NULL DEFAULT 0,
          confidence_score CHAR(1) NOT NULL DEFAULT 'D',
          min_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          p25_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          median_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          mean_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          trimmed_mean_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          p75_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          max_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          notes TEXT DEFAULT '',
          usd_to_gbp_rate DECIMAL(8,6) DEFAULT NULL
        )
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_ebay_snapshots_plant_date
          ON ebay_price_snapshots(plant_slug, checked_at DESC)
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS ebay_price_listings (
          id SERIAL PRIMARY KEY,
          snapshot_id INTEGER NOT NULL REFERENCES ebay_price_snapshots(id) ON DELETE CASCADE,
          plant_slug VARCHAR(255) NOT NULL,
          title TEXT NOT NULL,
          listing_type VARCHAR(50) NOT NULL DEFAULT 'unknown',
          lot_size INTEGER NOT NULL DEFAULT 1,
          sold_price DECIMAL(10,2) NOT NULL,
          shipping_price DECIMAL(10,2) NOT NULL DEFAULT 0,
          total_price DECIMAL(10,2) NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
          sold_date DATE,
          url TEXT NOT NULL DEFAULT '',
          seller VARCHAR(255),
          condition VARCHAR(100)
        )
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_ebay_listings_snapshot
          ON ebay_price_listings(snapshot_id)
      `);
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_ebay_listings_plant_date
          ON ebay_price_listings(plant_slug, sold_date DESC)
      `);

      // Insert snapshot row
      const snapRes = await db.query(
        `INSERT INTO ebay_price_snapshots (
           plant_slug, source, marketplace, query, checked_at, currency,
           raw_result_count, accepted_count, rejected_count, outlier_count,
           confidence_score, min_price, p25_price, median_price, mean_price,
           trimmed_mean_price, p75_price, max_price, notes, usd_to_gbp_rate
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         RETURNING id`,
        [
          snapshot.plantSlug,
          snapshot.source,
          snapshot.marketplace,
          snapshot.query,
          snapshot.checkedAt,
          snapshot.currency,
          snapshot.rawResultCount,
          snapshot.acceptedCount,
          snapshot.rejectedCount,
          snapshot.outlierCount,
          snapshot.confidenceScore,
          snapshot.minPrice ?? 0,
          snapshot.p25Price ?? 0,
          snapshot.medianPrice ?? 0,
          snapshot.meanPrice ?? 0,
          snapshot.trimmedMeanPrice ?? 0,
          snapshot.p75Price ?? 0,
          snapshot.maxPrice ?? 0,
          snapshot.notes,
          usdToGbpRate,
        ]
      );
      snapshotId = snapRes.rows[0].id;

      // Batch-insert accepted listings
      if (acceptedListings.length > 0) {
        const listingValues = acceptedListings.map((l, i) => {
          const base = i * 13;
          return `($${base + 1},$${base + 2},$${base + 3},$${base + 4},$${base + 5},$${base + 6},$${base + 7},$${base + 8},$${base + 9},$${base + 10},$${base + 11},$${base + 12},$${base + 13})`;
        });

        const listingParams: any[] = [];
        for (const l of acceptedListings) {
          listingParams.push(
            snapshotId,
            slug,
            l.title,
            l.listingType,
            l.lotSize,
            l.soldPrice,
            0, // shipping_price not stored in ClassifiedListing
            l.totalPrice,
            l.totalPrice / (l.lotSize || 1),
            l.currency,
            l.soldDate || null,
            l.url,
            null  // seller not stored post-classification
          );
        }

        await db.query(
          `INSERT INTO ebay_price_listings
             (snapshot_id, plant_slug, title, listing_type, lot_size,
              sold_price, shipping_price, total_price, unit_price,
              currency, sold_date, url, seller)
           VALUES ${listingValues.join(", ")}`,
          listingParams
        );
      }

      console.log(`[admin/prices/update] Saved snapshot ${snapshotId} for ${slug} (${acceptedListings.length} listings)`);
    } catch (dbErr) {
      console.warn("[admin/prices/update] DB write failed (non-fatal):", dbErr);
    }

    return NextResponse.json({
      success: true,
      snapshot,
      stats,
      acceptedListings,
      acceptedCount: classified.length,
      rejectedCount: rejected.length,
      rejectionBreakdown,
      sampleRejectedTitle: rejected.length > 0 ? rejected[0].listing.title : null,
      sampleRejectedReason: rejected.length > 0 ? rejected[0].reason : null,
      usdToGbpRate,
      snapshotId,
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
