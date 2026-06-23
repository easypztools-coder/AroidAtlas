import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getDbPool } from "@/lib/db";
import { approvedRetailers } from "@/lib/retail/retailers";
import { runRetailerAdapter } from "@/lib/retail/runRetailerAdapter";
import { matchProduct } from "@/lib/retail/matcher";
import { calculateRetailStats } from "@/lib/retail/stats";

export const maxDuration = 300; // Request maximum 5-minute timeout on Vercel Pro

export interface EnabledPlant {
  slug: string;
  genus: string;
  species: string;
  name: string;
  priceTracking: any;
  cultivar?: string;
}

function getEnabledPlants(): EnabledPlant[] {
  const plantsRoot = path.join(process.cwd(), "content", "plants");
  const list: EnabledPlant[] = [];
  if (!fs.existsSync(plantsRoot)) return [];

  const genera = fs.readdirSync(plantsRoot).filter((f) => {
    return fs.statSync(path.join(plantsRoot, f)).isDirectory();
  });

  for (const genus of genera) {
    const genusDir = path.join(plantsRoot, genus);
    const files = fs.readdirSync(genusDir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      const filePath = path.join(genusDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (data.priceTracking && data.priceTracking.enabled) {
          const cultivar = data.name.match(/'([^']+)'/)?.[1] || undefined;
          list.push({
            slug: data.slug,
            genus: data.genus,
            species: data.species,
            name: data.name,
            priceTracking: data.priceTracking,
            cultivar,
          });
        }
      } catch (err) {
        console.error(`Error parsing plant file: ${filePath}`, err);
      }
    }
  }

  return list;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  const { searchParams } = new URL(request.url);
  const secretParam = searchParams.get("secret");

  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret) {
    const isCronAuthorized = authHeader === `Bearer ${expectedSecret}`;
    const isSecretParamAuthorized = secretParam === expectedSecret;

    if (!isCronAuthorized && !isSecretParamAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = getDbPool();
  let runId: number | null = null;

  // 1. Ensure tables exist (idempotent — safe to run on every invocation)
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS retail_scrape_runs (
        id SERIAL PRIMARY KEY,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) NOT NULL DEFAULT 'running',
        retailer_count INTEGER DEFAULT 0,
        fetched_product_count INTEGER DEFAULT 0,
        accepted_count INTEGER DEFAULT 0,
        review_count INTEGER DEFAULT 0,
        rejected_count INTEGER DEFAULT 0,
        error_count INTEGER DEFAULT 0,
        error_summary TEXT
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS retail_price_observations (
        id SERIAL PRIMARY KEY,
        plant_slug VARCHAR(255) NOT NULL,
        retailer_slug VARCHAR(255) NOT NULL,
        retailer_name VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        product_url TEXT NOT NULL,
        price_gbp DECIMAL(10, 2) NOT NULL,
        original_price_gbp DECIMAL(10, 2),
        previous_price_gbp DECIMAL(10, 2),
        in_stock BOOLEAN NOT NULL DEFAULT TRUE,
        variant_title VARCHAR(255),
        pot_size_cm DECIMAL(5, 2),
        plant_size_label VARCHAR(50),
        source_method VARCHAR(50) NOT NULL,
        match_confidence DECIMAL(5, 4) NOT NULL,
        first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        last_price_change_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(retailer_slug, product_url)
      )
    `);
    // Composite index covering the retail-market API query pattern
    await db.query(`CREATE INDEX IF NOT EXISTS idx_obs_plant_stock_seen ON retail_price_observations(plant_slug, in_stock, last_seen_at DESC, price_gbp ASC)`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS retail_price_snapshots (
        id SERIAL PRIMARY KEY,
        plant_slug VARCHAR(255) NOT NULL,
        item_type VARCHAR(50) NOT NULL,
        checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
        observed_count INTEGER NOT NULL DEFAULT 0,
        min_price DECIMAL(10, 2) NOT NULL,
        p25_price DECIMAL(10, 2) NOT NULL,
        median_price DECIMAL(10, 2) NOT NULL,
        mean_price DECIMAL(10, 2) NOT NULL,
        trimmed_mean_price DECIMAL(10, 2) NOT NULL,
        p75_price DECIMAL(10, 2) NOT NULL,
        max_price DECIMAL(10, 2) NOT NULL
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_snapshots_plant_date ON retail_price_snapshots(plant_slug, checked_at)`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS retail_price_review_queue (
        id SERIAL PRIMARY KEY,
        retailer_slug VARCHAR(255) NOT NULL,
        product_title VARCHAR(255) NOT NULL,
        product_url TEXT NOT NULL,
        proposed_plant_slug VARCHAR(255) NOT NULL,
        match_confidence DECIMAL(5, 4) NOT NULL,
        proposed_item_type VARCHAR(50) NOT NULL,
        price_gbp DECIMAL(10, 2) NOT NULL,
        reason TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        reviewed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(retailer_slug, product_url)
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_review_status ON retail_price_review_queue(status)`);
    await db.query(`
      CREATE TABLE IF NOT EXISTS retail_scrape_errors (
        id SERIAL PRIMARY KEY,
        run_id INTEGER REFERENCES retail_scrape_runs(id) ON DELETE CASCADE,
        retailer_slug VARCHAR(255) NOT NULL,
        extraction_method VARCHAR(50) NOT NULL,
        http_status INTEGER,
        error_message TEXT,
        time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        retry_outcome VARCHAR(255)
      )
    `);
  } catch (migrateErr) {
    console.error("Failed to ensure DB schema:", migrateErr);
    return NextResponse.json({ error: "Database schema error" }, { status: 500 });
  }

  // 2. Initialize scrape run
  try {
    const runRes = await db.query(
      `INSERT INTO retail_scrape_runs (started_at, status, retailer_count)
       VALUES (CURRENT_TIMESTAMP, 'running', $1) RETURNING id`,
      [approvedRetailers.length]
    );
    runId = runRes.rows[0].id;
  } catch (dbErr) {
    console.error("Failed to initialize scrape run in database:", dbErr);
    return NextResponse.json(
      { error: "Database error initializing run" },
      { status: 500 }
    );
  }

  let fetchedProductCount = 0;
  let acceptedCount = 0;
  let reviewCount = 0;
  let rejectedCount = 0;
  let errorCount = 0;
  const errorsList: Array<{ retailer: string; message: string }> = [];

  const enabledPlants = getEnabledPlants();
  const allPlantsList = enabledPlants.map((p) => ({
    slug: p.slug,
    genus: p.genus,
    species: p.species,
    cultivar: p.cultivar,
  }));

  // 3. Loop over approved retailers
  for (const retailer of approvedRetailers) {
    console.log(`[Cron Scraper] Starting ${retailer.name} (${retailer.method})...`);

    try {
      const extracted = await runRetailerAdapter(retailer);
      console.log(`[Cron Scraper] Extracted ${extracted.length} products from ${retailer.name}`);
      fetchedProductCount += extracted.length;

      // Track product URLs seen in this run so we can mark absent ones out-of-stock
      const seenProductUrls: string[] = [];

      for (const prod of extracted) {
        let bestMatch: EnabledPlant | null = null;
        let highestConf = 0.0;
        let matchReason = "";
        let matchedItemType: any = "unknown";

        for (const plant of enabledPlants) {
          const match = matchProduct(prod.title, plant, allPlantsList);
          if (match.confidence > highestConf) {
            highestConf = match.confidence;
            bestMatch = plant;
            matchReason = match.reason;
            matchedItemType = match.itemType;
          }
        }

        if (highestConf >= 0.85 && bestMatch) {
          await upsertObservation(db, {
            plantSlug: bestMatch.slug,
            retailerSlug: prod.retailerSlug,
            retailerName: prod.retailerName,
            title: prod.title,
            productUrl: prod.productUrl,
            priceGbp: prod.priceGbp,
            originalPriceGbp: prod.originalPriceGbp,
            inStock: prod.inStock,
            variantTitle: prod.variantTitle,
            potSizeCm: prod.potSizeCm,
            plantSizeLabel: matchedItemType,
            sourceMethod: prod.sourceMethod,
            matchConfidence: highestConf,
          });
          seenProductUrls.push(prod.productUrl);
          acceptedCount++;
        } else if (highestConf >= 0.65 && bestMatch) {
          await upsertReviewQueue(db, {
            retailerSlug: prod.retailerSlug,
            title: prod.title,
            productUrl: prod.productUrl,
            plantSlug: bestMatch.slug,
            matchConfidence: highestConf,
            plantSizeLabel: matchedItemType,
            priceGbp: prod.priceGbp,
            reason: matchReason,
          });
          reviewCount++;
        } else {
          rejectedCount++;
        }
      }

      // Mark products from this retailer that weren't seen in this run as out-of-stock.
      // Only do this when the extraction succeeded and returned results — if extracted is
      // empty, we can't distinguish "retailer has no products" from a fetch failure.
      if (seenProductUrls.length > 0) {
        try {
          await db.query(
            `UPDATE retail_price_observations
             SET in_stock = false, updated_at = CURRENT_TIMESTAMP
             WHERE retailer_slug = $1
               AND in_stock = true
               AND product_url != ALL($2::text[])`,
            [retailer.slug, seenProductUrls]
          );
        } catch (cleanupErr) {
          console.error(`[Cron Scraper] Error marking stale listings for ${retailer.name}:`, cleanupErr);
        }
      }
    } catch (err: any) {
      console.error(`[Cron Scraper] Error scraping ${retailer.name}:`, err);
      errorCount++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      errorsList.push({ retailer: retailer.slug, message: errorMessage });

      try {
        await db.query(
          `INSERT INTO retail_scrape_errors
           (run_id, retailer_slug, extraction_method, http_status, error_message, time, retry_outcome)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, 'None')`,
          [runId, retailer.slug, retailer.method, 500, errorMessage]
        );
      } catch (logErr) {
        console.error("Failed to log scraper error to database:", logErr);
      }
    }
  }

  // 4. Calculate statistics per plant & type, and save snapshots
  console.log("[Cron Scraper] Re-calculating stats for all plant snapshots...");
  const checkedAt = new Date().toISOString();

  for (const plant of enabledPlants) {
    try {
      const obsRes = await db.query(
        `SELECT price_gbp, plant_size_label
         FROM retail_price_observations
         WHERE plant_slug = $1 AND in_stock = true AND last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'`,
        [plant.slug]
      );

      const observations = obsRes.rows;
      if (observations.length === 0) continue;

      const pricesByType: Record<string, number[]> = { all: [] };

      for (const obs of observations) {
        const price = parseFloat(obs.price_gbp);
        const type = obs.plant_size_label || "unknown";
        pricesByType.all.push(price);
        if (!pricesByType[type]) pricesByType[type] = [];
        pricesByType[type].push(price);
      }

      for (const [itemType, prices] of Object.entries(pricesByType)) {
        if (prices.length === 0) continue;
        const stats = calculateRetailStats(prices);

        await db.query(
          `INSERT INTO retail_price_snapshots (
             plant_slug, item_type, checked_at, currency, observed_count,
             min_price, p25_price, median_price, mean_price, trimmed_mean_price, p75_price, max_price
           ) VALUES ($1, $2, $3, 'GBP', $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            plant.slug,
            itemType,
            checkedAt,
            stats.count,
            stats.min,
            stats.p25,
            stats.median,
            stats.mean,
            stats.trimmedMean,
            stats.p75,
            stats.max,
          ]
        );
      }
    } catch (statsErr) {
      console.error(`[Cron Scraper] Error generating snapshot stats for ${plant.slug}:`, statsErr);
    }
  }

  // 4b. Prune snapshots older than 1 year to prevent unbounded table growth
  try {
    await db.query(
      `DELETE FROM retail_price_snapshots WHERE checked_at < CURRENT_TIMESTAMP - INTERVAL '1 year'`
    );
  } catch (pruneErr) {
    console.error("[Cron Scraper] Failed to prune old snapshots:", pruneErr);
  }

  // 5. Finalize scrape run record
  try {
    const errorSummary = errorsList.length > 0 ? JSON.stringify(errorsList) : null;

    await db.query(
      `UPDATE retail_scrape_runs SET
        completed_at = CURRENT_TIMESTAMP,
        status = 'completed',
        fetched_product_count = $1,
        accepted_count = $2,
        review_count = $3,
        rejected_count = $4,
        error_count = $5,
        error_summary = $6
       WHERE id = $7`,
      [
        fetchedProductCount,
        acceptedCount,
        reviewCount,
        rejectedCount,
        errorCount,
        errorSummary,
        runId,
      ]
    );
  } catch (finalDbErr) {
    console.error("Failed to complete scrape run in database:", finalDbErr);
  }

  return NextResponse.json({
    success: true,
    runId,
    stats: {
      retailerCount: approvedRetailers.length,
      fetchedProductCount,
      acceptedCount,
      reviewCount,
      rejectedCount,
      errorCount,
    },
    errors: errorsList,
  });
}

/**
 * Upsert a single retail price observation.
 *
 * Uses ON CONFLICT DO UPDATE for a single round-trip per product instead of
 * the previous SELECT + INSERT/UPDATE pattern (which cost 2 queries each).
 * previous_price_gbp and last_price_change_at are only updated when the price
 * actually changes by more than 1p, preserving the full price-change history.
 */
async function upsertObservation(db: any, obs: any) {
  await db.query(
    `INSERT INTO retail_price_observations (
       plant_slug, retailer_slug, retailer_name, title, product_url,
       price_gbp, original_price_gbp, previous_price_gbp, in_stock,
       variant_title, pot_size_cm, plant_size_label, source_method, match_confidence,
       first_seen_at, last_seen_at, last_price_change_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10, $11, $12, $13,
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (retailer_slug, product_url) DO UPDATE SET
       plant_slug           = EXCLUDED.plant_slug,
       retailer_name        = EXCLUDED.retailer_name,
       title                = EXCLUDED.title,
       price_gbp            = EXCLUDED.price_gbp,
       original_price_gbp   = EXCLUDED.original_price_gbp,
       previous_price_gbp   = CASE
                                WHEN ABS(retail_price_observations.price_gbp - EXCLUDED.price_gbp) > 0.01
                                THEN retail_price_observations.price_gbp
                                ELSE retail_price_observations.previous_price_gbp
                              END,
       in_stock             = EXCLUDED.in_stock,
       variant_title        = EXCLUDED.variant_title,
       pot_size_cm          = EXCLUDED.pot_size_cm,
       plant_size_label     = EXCLUDED.plant_size_label,
       source_method        = EXCLUDED.source_method,
       match_confidence     = EXCLUDED.match_confidence,
       last_seen_at         = CURRENT_TIMESTAMP,
       last_price_change_at = CASE
                                WHEN ABS(retail_price_observations.price_gbp - EXCLUDED.price_gbp) > 0.01
                                THEN CURRENT_TIMESTAMP
                                ELSE retail_price_observations.last_price_change_at
                              END,
       updated_at           = CURRENT_TIMESTAMP`,
    [
      obs.plantSlug,
      obs.retailerSlug,
      obs.retailerName,
      obs.title,
      obs.productUrl,
      obs.priceGbp,
      obs.originalPriceGbp || null,
      obs.inStock,
      obs.variantTitle || null,
      obs.potSizeCm || null,
      obs.plantSizeLabel || null,
      obs.sourceMethod,
      obs.matchConfidence,
    ]
  );
}

/**
 * Insert or update a review queue entry.
 *
 * The unique constraint on (retailer_slug, product_url) means the same product
 * won't accumulate multiple queue entries across cron runs. Existing reviewed
 * items (accepted/rejected) have their price and confidence updated in case
 * the product relists at a different price.
 */
async function upsertReviewQueue(db: any, item: any) {
  await db.query(
    `INSERT INTO retail_price_review_queue (
       retailer_slug, product_title, product_url, proposed_plant_slug,
       match_confidence, proposed_item_type, price_gbp, reason, status, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)
     ON CONFLICT (retailer_slug, product_url) DO UPDATE SET
       product_title     = EXCLUDED.product_title,
       proposed_plant_slug = EXCLUDED.proposed_plant_slug,
       match_confidence  = EXCLUDED.match_confidence,
       proposed_item_type = EXCLUDED.proposed_item_type,
       price_gbp         = EXCLUDED.price_gbp,
       reason            = EXCLUDED.reason`,
    [
      item.retailerSlug,
      item.title,
      item.productUrl,
      item.plantSlug,
      item.matchConfidence,
      item.plantSizeLabel,
      item.priceGbp,
      item.reason,
    ]
  );
}
