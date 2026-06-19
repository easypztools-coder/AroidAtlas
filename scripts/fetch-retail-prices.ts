/**
 * CLI tool: npx tsx scripts/fetch-retail-prices.ts [--plants=slug1,slug2]
 *
 * Runs the online retail shops price tracking pipeline:
 * 1. Discovers enabled plants in content/plants/
 * 2. Scrapes from approved retailers (Shopify JSON & WooCommerce)
 * 3. Filters and matches products using species/cultivar rules
 * 4. Calculates statistics (trimmed mean, median, min, max, percentiles)
 * 5. Saves snapshots locally (timestamped & latest.json) with fallback support
 * 6. If database credentials are set, updates the PostgreSQL database
 */

import fs from "fs";
import path from "path";
import { approvedRetailers } from "../src/lib/retail/retailers";
import { runRetailerAdapter } from "../src/lib/retail/runRetailerAdapter";
import { matchProduct } from "../src/lib/retail/matcher";
import { calculateRetailStats } from "../src/lib/retail/stats";
import { getDbPool } from "../src/lib/db";

// Load .env.local for local running
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      const value = values.join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key.trim()] = value;
    }
  }
}

// Parse CLI Arguments
const args = process.argv.slice(2);
let targetSlugs: string[] = [];

const plantsArg = args.find((arg) => arg.startsWith("--plants="));
if (plantsArg) {
  targetSlugs = plantsArg
    .replace("--plants=", "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const plantsRoot = path.join(process.cwd(), "content", "plants");
const snapshotsRoot = path.join(process.cwd(), "content", "retail-snapshots");

interface EnabledPlant {
  slug: string;
  genus: string;
  species: string;
  name: string;
  priceTracking: any;
  cultivar?: string;
  filePath: string;
}

// Discover enabled plants
function getEnabledPlants(): EnabledPlant[] {
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
            filePath,
          });
        }
      } catch (err) {
        console.error(`Error parsing plant file: ${filePath}`, err);
      }
    }
  }

  return list;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  ARIOD ATLAS RETAIL PRICE FETCH WORKFLOW");
  console.log("=".repeat(60));

  const allPlants = getEnabledPlants();
  let plantsToRun = allPlants;

  if (targetSlugs.length > 0) {
    plantsToRun = allPlants.filter((p) => targetSlugs.includes(p.slug));
    const missing = targetSlugs.filter((slug) => !allPlants.some((p) => p.slug === slug));
    if (missing.length > 0) {
      console.warn(`Warning: Could not find enabled plant configs for slugs: ${missing.join(", ")}`);
    }
  }

  if (plantsToRun.length === 0) {
    console.log("No price-tracking enabled plants found to update.");
    return;
  }

  console.log(`Discovered ${allPlants.length} tracking-enabled plants. Running for ${plantsToRun.length}...`);

  // Map for match cross-checks
  const allPlantsList = allPlants.map((p) => ({
    slug: p.slug,
    genus: p.genus,
    species: p.species,
    cultivar: p.cultivar,
  }));

  // Store observations per plant slug
  const observationsMap: Record<string, any[]> = {};
  for (const plant of plantsToRun) {
    observationsMap[plant.slug] = [];
  }

  let totalScrapedCount = 0;
  let totalMatchedCount = 0;

  // 1. Scrape all approved retailers
  for (const retailer of approvedRetailers) {
    console.log(`\nScraping ${retailer.name} (${retailer.method})...`);
    try {
      const extracted = await runRetailerAdapter(retailer);
      console.log(`  ✓ Extracted ${extracted.length} products.`);
      totalScrapedCount += extracted.length;

      // Match products against our plants
      for (const prod of extracted) {
        let bestMatch: EnabledPlant | null = null;
        let highestConf = 0.0;
        let matchedItemType: any = "unknown";

        for (const plant of plantsToRun) {
          const match = matchProduct(prod.title, plant, allPlantsList);
          if (match.confidence > highestConf) {
            highestConf = match.confidence;
            bestMatch = plant;
            matchedItemType = match.itemType;
          }
        }

        // Auto-accept high confidence matches (>= 0.85)
        if (highestConf >= 0.85 && bestMatch) {
          observationsMap[bestMatch.slug].push({
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
          totalMatchedCount++;
        }
      }
    } catch (err: any) {
      console.error(`  ✗ Error scraping ${retailer.name}:`, err.message || err);
    }
  }

  console.log(`\nScrape finished. Total items extracted: ${totalScrapedCount}, matched: ${totalMatchedCount}`);

  // Check if DB credentials exist
  const hasDb = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  let db: any = null;
  let runId: number | null = null;

  if (hasDb) {
    try {
      db = getDbPool();
      const runRes = await db.query(
        `INSERT INTO retail_scrape_runs (started_at, status, retailer_count) 
         VALUES (CURRENT_TIMESTAMP, 'running', $1) RETURNING id`,
        [approvedRetailers.length]
      );
      runId = runRes.rows[0].id;
      console.log(`Database scrape run registered: ID ${runId}`);
    } catch (dbErr) {
      console.error("Database connection failed, running offline-only:", dbErr);
    }
  } else {
    console.log("No DATABASE_URL or POSTGRES_URL environment variable found. Saving to local files only.");
  }

  const checkedAt = new Date().toISOString();

  // 2. Process statistics and save snapshots per plant
  for (const plant of plantsToRun) {
    const observations = observationsMap[plant.slug];
    if (observations.length === 0) {
      console.log(`No active listings found for ${plant.slug}, skipping snapshot.`);
      continue;
    }

    console.log(`\nProcessing: ${plant.slug} (${observations.length} matched listings)`);

    // Group prices by item type/size label
    const pricesByType: Record<string, number[]> = {
      all: [],
    };

    for (const obs of observations) {
      if (!obs.inStock) continue;
      const price = obs.priceGbp;
      const type = obs.plantSizeLabel || "unknown";

      pricesByType.all.push(price);
      if (!pricesByType[type]) {
        pricesByType[type] = [];
      }
      pricesByType[type].push(price);
    }

    if (pricesByType.all.length === 0) {
      console.log(`  ⚠️ No in-stock listings for stats. Skipping snapshot stats.`);
      continue;
    }

    // Compute stats by type
    const statsByType: Record<string, any> = {};
    for (const [type, prices] of Object.entries(pricesByType)) {
      if (prices.length === 0) continue;
      statsByType[type] = calculateRetailStats(prices);
    }

    const overallStats = statsByType.all;
    console.log(`  Overall retail stats: count=${overallStats.count}, trimmedMean=£${overallStats.trimmedMean.toFixed(2)}, min=£${overallStats.min.toFixed(2)}, max=£${overallStats.max.toFixed(2)}`);

    // ─── Save Snapshot Locally ───────────────────────────────────────────────
    const plantSnapshotDir = path.join(snapshotsRoot, plant.slug);
    fs.mkdirSync(plantSnapshotDir, { recursive: true });

    const localSnapshotData = {
      plantSlug: plant.slug,
      checkedAt,
      listings: observations,
      statsByType,
    };

    const timestampFileName = `${checkedAt.replace(/[:.]/g, "-")}.json`;
    fs.writeFileSync(
      path.join(plantSnapshotDir, timestampFileName),
      JSON.stringify(localSnapshotData, null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(plantSnapshotDir, "latest.json"),
      JSON.stringify(localSnapshotData, null, 2),
      "utf-8"
    );
    console.log(`  ✓ Saved local JSON snapshot to: content/retail-snapshots/${plant.slug}/`);

    // ─── Save to Database (if active) ────────────────────────────────────────
    if (db && runId) {
      try {
        // Upsert observations
        for (const obs of observations) {
          const existingRes = await db.query(
            "SELECT id, price_gbp FROM retail_price_observations WHERE retailer_slug = $1 AND product_url = $2",
            [obs.retailerSlug, obs.productUrl]
          );

          if (existingRes.rows.length === 0) {
            await db.query(
              `INSERT INTO retail_price_observations (
                plant_slug, retailer_slug, retailer_name, title, product_url,
                price_gbp, original_price_gbp, in_stock, variant_title, pot_size_cm,
                plant_size_label, source_method, match_confidence, first_seen_at, last_seen_at, last_price_change_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
              [
                plant.slug,
                obs.retailerSlug,
                obs.retailerName,
                obs.title,
                obs.productUrl,
                obs.priceGbp,
                obs.originalPriceGbp || null,
                obs.inStock,
                obs.variantTitle || null,
                obs.potSizeCm || null,
                obs.plantSizeLabel,
                obs.sourceMethod,
                obs.matchConfidence,
              ]
            );
          } else {
            const existing = existingRes.rows[0];
            const oldPrice = parseFloat(existing.price_gbp);
            const newPrice = obs.priceGbp;
            const priceChanged = Math.abs(oldPrice - newPrice) > 0.01;

            await db.query(
              `UPDATE retail_price_observations SET
                plant_slug = $1,
                retailer_name = $2,
                title = $3,
                price_gbp = $4,
                original_price_gbp = $5,
                in_stock = $6,
                variant_title = $7,
                pot_size_cm = $8,
                plant_size_label = $9,
                source_method = $10,
                match_confidence = $11,
                last_seen_at = CURRENT_TIMESTAMP,
                last_price_change_at = $12,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = $13`,
              [
                plant.slug,
                obs.retailerName,
                obs.title,
                newPrice,
                obs.originalPriceGbp || null,
                obs.inStock,
                obs.variantTitle || null,
                obs.potSizeCm || null,
                obs.plantSizeLabel,
                obs.sourceMethod,
                obs.matchConfidence,
                priceChanged ? new Date() : new Date(existing.last_price_change_at || Date.now()),
                existing.id,
              ]
            );
          }
        }

        // Insert Snapshots
        for (const [itemType, stats] of Object.entries(statsByType)) {
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
        console.log(`  ✓ Database tables updated.`);
      } catch (dbWriteErr) {
        console.error(`  ✗ Database write failed for ${plant.slug}:`, dbWriteErr);
      }
    }
  }

  // Update scrape run record in database if available
  if (db && runId) {
    try {
      await db.query(
        `UPDATE retail_scrape_runs SET
          completed_at = CURRENT_TIMESTAMP,
          status = 'completed',
          fetched_product_count = $1,
          accepted_count = $2
         WHERE id = $3`,
        [totalScrapedCount, totalMatchedCount, runId]
      );
      console.log(`\n✓ Database scrape run completed.`);
    } catch (finalDbErr) {
      console.error("Failed to complete database scrape run:", finalDbErr);
    }
  }

  console.log("\n================================================------------");
  console.log("Retail price updates complete.");
  console.log("================================================------------\n");
}

main().catch((err) => {
  console.error("Workflow failed:", err);
  process.exit(1);
});
