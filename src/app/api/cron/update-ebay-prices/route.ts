import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { fetchSoldCompsRaw } from "@/lib/prices/soldcomps";
import { normaliseListing } from "@/lib/prices/normaliseListing";
import { filterPlantListings } from "@/lib/prices/filterPlantListings";
import { classifyListing } from "@/lib/prices/classifyPlantListing";
import { calculateStats } from "@/lib/prices/calculatePriceStats";
import { fetchUsdToGbpRate } from "@/lib/prices/fetchExchangeRate";
import { getDbPool } from "@/lib/db";
import type { PriceTrackingConfig } from "@/lib/prices/types";

export const maxDuration = 300;

interface EnabledPlant {
  slug: string;
  filePath: string;
  config: PriceTrackingConfig;
}

function getEnabledPlants(): EnabledPlant[] {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  const list: EnabledPlant[] = [];
  if (!fs.existsSync(plantsRoot)) return [];

  const genera = fs.readdirSync(plantsRoot).filter((f) =>
    fs.statSync(path.join(plantsRoot, f)).isDirectory()
  );

  for (const genus of genera) {
    const genusDir = path.join(plantsRoot, genus);
    for (const file of fs.readdirSync(genusDir).filter((f) => f.endsWith(".json"))) {
      const filePath = path.join(genusDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (data.priceTracking?.enabled) {
          list.push({ slug: data.slug, filePath, config: data.priceTracking });
        }
      } catch {
        // skip malformed files
      }
    }
  }
  return list;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  const adminSecret = process.env.ADMIN_PRICE_SECRET;

  // Accept either CRON_SECRET or ADMIN_PRICE_SECRET so the admin endpoint can
  // delegate to this one without needing two different secrets configured.
  const validSecrets = [cronSecret, adminSecret].filter(Boolean) as string[];
  if (validSecrets.length > 0) {
    const ok =
      validSecrets.some((s) => authHeader === `Bearer ${s}`) ||
      validSecrets.some((s) => secretParam === s);
    if (!ok) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Optional pagination: ?page=0&pageSize=20 (default: all plants, max 50 per call)
  const pageParam = searchParams.get("page");
  const pageSizeParam = searchParams.get("pageSize");
  const page = pageParam !== null ? parseInt(pageParam, 10) : null;
  const pageSize = Math.min(parseInt(pageSizeParam ?? "50", 10), 100);

  const allPlants = getEnabledPlants();
  const plants = page !== null
    ? allPlants.slice(page * pageSize, (page + 1) * pageSize)
    : allPlants;

  if (plants.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No plants to process",
      totalEnabled: allPlants.length,
      processed: 0,
    });
  }

  const usdToGbpRate = await fetchUsdToGbpRate();
  const snapshotsRoot = path.join(process.cwd(), "content", "price-snapshots");
  const checkedAt = new Date().toISOString();

  const results: Array<{
    slug: string;
    accepted: number;
    rejected: number;
    trimmedMean: number | null;
    error?: string;
  }> = [];

  let db: ReturnType<typeof getDbPool> | null = null;
  try {
    db = getDbPool();
    // Ensure tables exist
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
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_ebay_listings_plant_url
        ON ebay_price_listings(plant_slug, url) WHERE url <> ''
    `);
    // One-time cleanup of existing duplicates
    await db.query(`
      DELETE FROM ebay_price_listings
      WHERE url <> ''
        AND id NOT IN (
          SELECT MIN(id)
          FROM ebay_price_listings
          WHERE url <> ''
          GROUP BY plant_slug, url
        )
    `);
  } catch (dbErr) {
    console.error("[update-ebay-prices] DB setup failed (non-fatal):", dbErr);
    db = null;
  }

  for (const { slug, filePath, config } of plants) {
    try {
      console.log(`[update-ebay-prices] Processing: ${slug}`);
      const rawItems = await fetchSoldCompsRaw({
        query: config.query,
        marketplace: config.marketplace,
      });

      const normalised = rawItems.map((item) => normaliseListing(item, usdToGbpRate));
      const { accepted, rejected } = filterPlantListings(normalised, config);
      const classified = accepted.map(classifyListing);
      const stats = calculateStats(classified, rejected.length);

      const snapshot = {
        plantSlug: slug,
        source: config.source,
        marketplace: config.marketplace,
        query: config.query,
        checkedAt,
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

      // ── Save to DB ────────────────────────────────────────────────────────
      if (db) {
        try {
          const snapRes = await db.query(
            `INSERT INTO ebay_price_snapshots (
               plant_slug, source, marketplace, query, checked_at, currency,
               raw_result_count, accepted_count, rejected_count, outlier_count,
               confidence_score, min_price, p25_price, median_price, mean_price,
               trimmed_mean_price, p75_price, max_price, notes, usd_to_gbp_rate
             ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
             RETURNING id`,
            [
              snapshot.plantSlug, snapshot.source, snapshot.marketplace,
              snapshot.query, snapshot.checkedAt, snapshot.currency,
              snapshot.rawResultCount, snapshot.acceptedCount, snapshot.rejectedCount,
              snapshot.outlierCount, snapshot.confidenceScore,
              snapshot.minPrice ?? 0, snapshot.p25Price ?? 0, snapshot.medianPrice ?? 0,
              snapshot.meanPrice ?? 0, snapshot.trimmedMeanPrice ?? 0,
              snapshot.p75Price ?? 0, snapshot.maxPrice ?? 0,
              snapshot.notes, usdToGbpRate,
            ]
          );
          const snapshotId = snapRes.rows[0].id;

          if (acceptedListings.length > 0) {
            const vals = acceptedListings.map((_, i) => {
              const b = i * 13;
              return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12},$${b+13})`;
            });
            const params: any[] = [];
            for (const l of acceptedListings) {
              params.push(
                snapshotId, slug, l.title, l.listingType, l.lotSize,
                l.soldPrice, 0, l.totalPrice, l.totalPrice / (l.lotSize || 1),
                l.currency, l.soldDate || null, l.url, null
              );
            }
            await db.query(
              `INSERT INTO ebay_price_listings
                 (snapshot_id, plant_slug, title, listing_type, lot_size,
                  sold_price, shipping_price, total_price, unit_price,
                  currency, sold_date, url, seller)
               VALUES ${vals.join(", ")}
               ON CONFLICT (plant_slug, url) WHERE url <> '' DO NOTHING`,
              params
            );
          }
        } catch (dbErr) {
          console.error(`[update-ebay-prices] DB write failed for ${slug}:`, dbErr);
        }
      }

      // ── Save to filesystem ─────────────────────────────────────────────────
      const plantSnapshotDir = path.join(snapshotsRoot, slug);
      fs.mkdirSync(plantSnapshotDir, { recursive: true });
      const snapshotData = { snapshot, stats, acceptedListings };
      const timestampFileName = `${checkedAt.replace(/[:.]/g, "-")}.json`;
      fs.writeFileSync(
        path.join(plantSnapshotDir, timestampFileName),
        JSON.stringify(snapshotData, null, 2),
        "utf-8"
      );
      fs.writeFileSync(
        path.join(plantSnapshotDir, "latest.json"),
        JSON.stringify(snapshotData, null, 2),
        "utf-8"
      );

      // ── Update plant JSON median price ────────────────────────────────────
      if (stats.trimmedMean > 0) {
        try {
          const plantJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
          if (!plantJson.marketMetrics) {
            plantJson.marketMetrics = { currentMedianPriceGBP: null, threeMonthChangePercent: null, marketStatus: null };
          }
          plantJson.marketMetrics.currentMedianPriceGBP = Math.round(stats.trimmedMean);
          fs.writeFileSync(filePath, JSON.stringify(plantJson, null, 2), "utf-8");
        } catch {
          // non-fatal
        }
      }

      results.push({
        slug,
        accepted: classified.length,
        rejected: rejected.length,
        trimmedMean: stats.trimmedMean > 0 ? Math.round(stats.trimmedMean) : null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[update-ebay-prices] Error for ${slug}:`, msg);
      results.push({ slug, accepted: 0, rejected: 0, trimmedMean: null, error: msg });
    }
  }

  const nextPage = page !== null && (page + 1) * pageSize < allPlants.length
    ? page + 1
    : null;

  return NextResponse.json({
    success: true,
    processed: results.length,
    totalEnabled: allPlants.length,
    page: page ?? "all",
    pageSize: page !== null ? pageSize : plants.length,
    nextPage,
    results,
  });
}
