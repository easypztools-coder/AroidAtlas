/**
 * CLI tool: npx tsx scripts/fetch-live-prices.ts [--plants=slug1,slug2]
 *
 * Runs the SoldComps price update pipeline:
 * 1. Discovers enabled plants in content/plants/
 * 2. Fetches from SoldComps API (with 1.5s delay between calls to avoid rate limits)
 * 3. Filters, classifies, and calculates price stats
 * 4. Saves price snapshots to content/price-snapshots/ (filesystem/git)
 * 5. Saves to Postgres database if DATABASE_URL / POSTGRES_URL is set
 * 6. Updates static plant details in content/plants/ with new median prices and tiers
 */

import fs from "fs";
import path from "path";
import { fetchSoldCompsRaw } from "../src/lib/prices/soldcomps";
import { normaliseListing } from "../src/lib/prices/normaliseListing";
import { filterPlantListings } from "../src/lib/prices/filterPlantListings";
import { classifyListing } from "../src/lib/prices/classifyPlantListing";
import { calculateStats } from "../src/lib/prices/calculatePriceStats";
import { fetchUsdToGbpRate } from "../src/lib/prices/fetchExchangeRate";
import { getPriceRarityTier } from "../src/lib/prices/priceRarityTier";
import { getDbPool } from "../src/lib/db";
import type { PriceTrackingConfig } from "../src/lib/prices/types";

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

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const RATE_LIMIT_DELAY_MS = 1500; // 1.5s between SoldComps API calls

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
const snapshotsRoot = path.join(process.cwd(), "content", "price-snapshots");

interface DiscoveredPlant {
  slug: string;
  filePath: string;
  config: PriceTrackingConfig;
}

// ─── 1. DISCOVER PLANTS ──────────────────────────────────────────────────
function discoverPlants(): DiscoveredPlant[] {
  const list: DiscoveredPlant[] = [];
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
          list.push({
            slug: data.slug,
            filePath,
            config: data.priceTracking,
          });
        }
      } catch (err) {
        console.error(`Error parsing plant file: ${filePath}`, err);
      }
    }
  }

  return list;
}

// ─── 2. RUN PIPELINE FOR EACH PLANT ──────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log("  AROID ATLAS LIVE PRICE FETCH WORKFLOW");
  console.log("=".repeat(60));

  const allPlants = discoverPlants();
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

  console.log(`Discovered ${allPlants.length} tracking-enabled plants. Running pipeline for ${plantsToRun.length}...`);

  // ─── Fetch live USD/GBP exchange rate ────────────────────────────────────
  const usdToGbpRate = await fetchUsdToGbpRate();
  console.log(`USD → GBP rate: ${usdToGbpRate}`);

  // ─── DB connection (optional) ─────────────────────────────────────────────
  const hasDb = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  let db: ReturnType<typeof getDbPool> | null = null;
  if (hasDb) {
    try {
      db = getDbPool();
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
      await db.query(`CREATE INDEX IF NOT EXISTS idx_ebay_snapshots_plant_date ON ebay_price_snapshots(plant_slug, checked_at DESC)`);
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
      await db.query(`CREATE INDEX IF NOT EXISTS idx_ebay_listings_plant_date ON ebay_price_listings(plant_slug, sold_date DESC)`);
      // Unique index prevents the same eBay sold listing accumulating across repeated runs
      await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_ebay_listings_plant_url ON ebay_price_listings(plant_slug, url) WHERE url <> ''`);
      // One-time cleanup: remove duplicate URL rows, keeping the earliest insert per plant+url
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
      console.log("Database connection established — snapshots will also be saved to Postgres.");
    } catch (dbErr) {
      console.warn("Database connection failed, running filesystem-only:", dbErr);
      db = null;
    }
  } else {
    console.log("No DATABASE_URL / POSTGRES_URL found — saving to local files only.");
  }

  for (const { slug, filePath, config } of plantsToRun) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`Processing: ${slug}`);
    console.log(`Query:      "${config.query}"`);
    console.log(`Market:     ${config.marketplace}`);
    console.log(`------------------------------------------------------------`);

    try {
      // Fetch (with delay to respect SoldComps rate limits)
      await delay(RATE_LIMIT_DELAY_MS);
      console.log(`  Fetching sold comps from API...`);
      const rawItems = await fetchSoldCompsRaw({
        query: config.query,
        marketplace: config.marketplace,
      });
      console.log(`  ✓ Fetched ${rawItems.length} raw results.`);

      // Pipeline calculations
      const normalised = rawItems.map((item) => normaliseListing(item, usdToGbpRate));
      const { accepted, rejected } = filterPlantListings(normalised, config);
      const classified = accepted.map(classifyListing);
      const stats = calculateStats(classified, rejected.length);
      console.log(`  ✓ Filtered: ${classified.length} accepted, ${rejected.length} rejected.`);

      // Update plant file data locally
      let updatedTier = config.marketCurrency === "GBP" ? getPriceRarityTier(stats.trimmedMean).tier : "£££";
      if (stats.trimmedMean > 0) {
        const plantJson = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        const oldTier = plantJson.priceGuideTier;
        const oldMedian = plantJson.marketMetrics?.currentMedianPriceGBP;

        plantJson.priceGuideTier = updatedTier;
        if (!plantJson.marketMetrics) {
          plantJson.marketMetrics = { currentMedianPriceGBP: null, threeMonthChangePercent: null, marketStatus: null };
        }
        
        // Save rounded trimmed mean as the median price
        const roundedPrice = Math.round(stats.trimmedMean);
        plantJson.marketMetrics.currentMedianPriceGBP = roundedPrice;
        
        fs.writeFileSync(filePath, JSON.stringify(plantJson, null, 2), "utf-8");
        console.log(`  ✓ Updated plant configuration:`);
        console.log(`    - Price Tier: ${oldTier} → ${updatedTier}`);
        console.log(`    - Median Price: ${oldMedian ? `£${oldMedian}` : "null"} → £${roundedPrice}`);
      } else {
        console.log(`  ⚠️ Trimmed mean price is 0, skipping plant config update.`);
      }

      // Create Snapshot
      const checkedAt = new Date().toISOString();
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

      const snapshotData = {
        snapshot,
        stats,
        acceptedListings,
        acceptedCount: classified.length,
        rejectedCount: rejected.length,
        rejectionBreakdown,
      };

      // Save snapshots
      const plantSnapshotDir = path.join(snapshotsRoot, slug);
      fs.mkdirSync(plantSnapshotDir, { recursive: true });

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

      console.log(`  ✓ Saved snapshot to: content/price-snapshots/${slug}/`);

      // ─── Save to Database ──────────────────────────────────────────────────
      if (db && classified.length > 0) {
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

          const vals = classified.map((_, i) => {
            const b = i * 13;
            return `($${b+1},$${b+2},$${b+3},$${b+4},$${b+5},$${b+6},$${b+7},$${b+8},$${b+9},$${b+10},$${b+11},$${b+12},$${b+13})`;
          });
          const params: any[] = [];
          for (const l of classified) {
            params.push(
              snapshotId, slug, l.originalTitle, l.listingType, l.lotSize,
              l.soldPrice, l.shippingPrice, l.totalPrice, l.unitPrice,
              l.currency, l.soldDate || null, l.url, l.seller || null
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
          console.log(`  ✓ Saved to database (snapshot ID: ${snapshotId})`);
        } catch (dbErr) {
          console.error(`  ✗ DB write failed for ${slug}:`, dbErr instanceof Error ? dbErr.message : String(dbErr));
        }
      }
    } catch (err) {
      console.error(`  ✗ Error processing ${slug}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`\n================================================------------`);
  console.log("Price updates complete.");
  console.log(`================================================------------\n`);
}

main().catch((err) => {
  console.error("Workflow failed:", err);
  process.exit(1);
});
