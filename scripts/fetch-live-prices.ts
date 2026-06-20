/**
 * CLI tool: npx tsx scripts/fetch-live-prices.ts [--plants=slug1,slug2]
 *
 * Runs the SoldComps price update pipeline directly on disk:
 * 1. Discovers enabled plants in content/plants/
 * 2. Fetches from SoldComps API
 * 3. Filters, classifies, and calculates price stats
 * 4. Saves price snapshots (timestamped & latest.json)
 * 5. Updates static plant details in content/plants/ with new median prices and tiers
 */

import fs from "fs";
import path from "path";
import { fetchSoldCompsRaw } from "../src/lib/prices/soldcomps";
import { normaliseListing } from "../src/lib/prices/normaliseListing";
import { filterPlantListings } from "../src/lib/prices/filterPlantListings";
import { classifyListing } from "../src/lib/prices/classifyPlantListing";
import { calculateStats } from "../src/lib/prices/calculatePriceStats";
import { getPriceRarityTier } from "../src/lib/prices/priceRarityTier";
import type { PriceTrackingConfig } from "../src/lib/prices/types";

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
  console.log("  ARIOD ATLAS LIVE PRICE FETCH WORKFLOW");
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

  for (const { slug, filePath, config } of plantsToRun) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`Processing: ${slug}`);
    console.log(`Query:      "${config.query}"`);
    console.log(`Market:     ${config.marketplace}`);
    console.log(`------------------------------------------------------------`);

    try {
      // Fetch
      console.log(`  Fetching sold comps from API...`);
      const rawItems = await fetchSoldCompsRaw({
        query: config.query,
        marketplace: config.marketplace,
      });
      console.log(`  ✓ Fetched ${rawItems.length} raw results.`);

      // Pipeline calculations
      const normalised = rawItems.map(normaliseListing);
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
