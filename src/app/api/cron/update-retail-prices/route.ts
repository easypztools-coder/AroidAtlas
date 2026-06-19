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

// Helper to discover enabled plants from content/plants/
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

  // Protect it (allow local testing if no secret configured or matching parameter)
  if (expectedSecret) {
    const isCronAuthorized = authHeader === `Bearer ${expectedSecret}`;
    const isSecretParamAuthorized = secretParam === expectedSecret;

    if (!isCronAuthorized && !isSecretParamAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = getDbPool();
  let runId: number | null = null;

  // 1. Initialize scrape run in database
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

  // Load all enabled plants from filesystem
  const enabledPlants = getEnabledPlants();

  // Map of plant data for matching safety checks
  const allPlantsList = enabledPlants.map((p) => ({
    slug: p.slug,
    genus: p.genus,
    species: p.species,
    cultivar: p.cultivar,
  }));

  // 2. Loop over approved retailers
  for (const retailer of approvedRetailers) {
    console.log(`[Cron Scraper] Starting ${retailer.name} (${retailer.method})...`);

    try {
      // Run the adapter
      const extracted = await runRetailerAdapter(retailer);
      console.log(`[Cron Scraper] Extracted ${extracted.length} products from ${retailer.name}`);
      fetchedProductCount += extracted.length;

      // Process matched products
      for (const prod of extracted) {
        let bestMatch: EnabledPlant | null = null;
        let highestConf = 0.0;
        let matchReason = "";
        let matchedItemType: any = "unknown";

        // Find the best matching plant profile
        for (const plant of enabledPlants) {
          const match = matchProduct(prod.title, plant, allPlantsList);
          if (match.confidence > highestConf) {
            highestConf = match.confidence;
            bestMatch = plant;
            matchReason = match.reason;
            matchedItemType = match.itemType;
          }
        }

        // Categorize based on match confidence
        if (highestConf >= 0.85 && bestMatch) {
          // Save automatically with deduplication
          const observation = {
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
          };

          await upsertObservation(db, observation);
          acceptedCount++;
        } else if (highestConf >= 0.65 && bestMatch) {
          // Place in review queue
          await insertIntoReviewQueue(db, {
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
          // Reject
          rejectedCount++;
        }
      }
    } catch (err: any) {
      console.error(`[Cron Scraper] Error scraping ${retailer.name}:`, err);
      errorCount++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      errorsList.push({ retailer: retailer.slug, message: errorMessage });

      // Log retailer error to database
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

  // 3. Calculate statistics per plant & type, and save to snapshots
  console.log("[Cron Scraper] Re-calculating stats for all plant snapshots...");
  const checkedAt = new Date().toISOString();

  for (const plant of enabledPlants) {
    try {
      // Fetch all active, in-stock observations for this plant seen in the last 24h
      const obsRes = await db.query(
        `SELECT price_gbp, plant_size_label 
         FROM retail_price_observations 
         WHERE plant_slug = $1 AND in_stock = true AND last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'`,
        [plant.slug]
      );

      const observations = obsRes.rows;

      if (observations.length === 0) continue;

      // Group prices by item type
      const pricesByType: Record<string, number[]> = {
        all: [],
      };

      for (const obs of observations) {
        const price = parseFloat(obs.price_gbp);
        const type = obs.plant_size_label || "unknown";

        pricesByType.all.push(price);
        if (!pricesByType[type]) {
          pricesByType[type] = [];
        }
        pricesByType[type].push(price);
      }

      // Save snapshots for each group
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

  // 4. Update scrape run record in database
  try {
    const errorSummary =
      errorsList.length > 0 ? JSON.stringify(errorsList) : null;

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

// Database helper functions
async function upsertObservation(db: any, obs: any) {
  const existingRes = await db.query(
    "SELECT id, price_gbp FROM retail_price_observations WHERE retailer_slug = $1 AND product_url = $2",
    [obs.retailerSlug, obs.productUrl]
  );

  if (existingRes.rows.length === 0) {
    await db.query(
      `INSERT INTO retail_price_observations (
        plant_slug, retailer_slug, retailer_name, title, product_url,
        price_gbp, original_price_gbp, previous_price_gbp, in_stock,
        variant_title, pot_size_cm, plant_size_label, source_method, match_confidence,
        first_seen_at, last_seen_at, last_price_change_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
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
  } else {
    const existing = existingRes.rows[0];
    const oldPrice = parseFloat(existing.price_gbp);
    const newPrice = obs.priceGbp;

    if (Math.abs(oldPrice - newPrice) > 0.01) {
      await db.query(
        `UPDATE retail_price_observations SET
          plant_slug = $1,
          retailer_name = $2,
          title = $3,
          price_gbp = $4,
          original_price_gbp = $5,
          previous_price_gbp = $6,
          in_stock = $7,
          variant_title = $8,
          pot_size_cm = $9,
          plant_size_label = $10,
          source_method = $11,
          match_confidence = $12,
          last_seen_at = CURRENT_TIMESTAMP,
          last_price_change_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $13`,
        [
          obs.plantSlug,
          obs.retailerName,
          obs.title,
          newPrice,
          obs.originalPriceGbp || null,
          oldPrice,
          obs.inStock,
          obs.variantTitle || null,
          obs.potSizeCm || null,
          obs.plantSizeLabel || null,
          obs.sourceMethod,
          obs.matchConfidence,
          existing.id,
        ]
      );
    } else {
      await db.query(
        `UPDATE retail_price_observations SET
          plant_slug = $1,
          retailer_name = $2,
          title = $3,
          original_price_gbp = $4,
          in_stock = $5,
          variant_title = $6,
          pot_size_cm = $7,
          plant_size_label = $8,
          source_method = $9,
          match_confidence = $10,
          last_seen_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $11`,
        [
          obs.plantSlug,
          obs.retailerName,
          obs.title,
          obs.originalPriceGbp || null,
          obs.inStock,
          obs.variantTitle || null,
          obs.potSizeCm || null,
          obs.plantSizeLabel || null,
          obs.sourceMethod,
          obs.matchConfidence,
          existing.id,
        ]
      );
    }
  }
}

async function insertIntoReviewQueue(db: any, item: any) {
  const existing = await db.query(
    "SELECT id FROM retail_price_review_queue WHERE retailer_slug = $1 AND product_url = $2 AND status = 'pending'",
    [item.retailerSlug, item.productUrl]
  );
  if (existing.rows.length === 0) {
    await db.query(
      `INSERT INTO retail_price_review_queue (
        retailer_slug, product_title, product_url, proposed_plant_slug,
        match_confidence, proposed_item_type, price_gbp, reason, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', CURRENT_TIMESTAMP)`,
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
}
