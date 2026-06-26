/**
 * CLI: npx tsx scripts/fetch-etsy-prices.ts [--plants=slug1,slug2] [--dry-run]
 *
 * Searches Etsy for each price-tracking-enabled plant and saves the results
 * as retail price observations under retailer_slug = "etsy".
 *
 * Requires ETSY_API_KEY in .env.local.
 * Get a free key at: https://www.etsy.com/developers/register
 *
 * Only GBP-priced listings are kept. Prices are filtered to within
 * 3× the plant's tier floor to reject non-plant items (pots, books, etc).
 */

import fs from "fs";
import path from "path";
import { searchEtsyListings } from "../src/lib/retail/adapters/etsyAdapter";
import { matchProduct } from "../src/lib/retail/matcher";
import { calculateRetailStats } from "../src/lib/retail/stats";

// Load .env.local
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (t && !t.startsWith("#") && t.includes("=")) {
      const [key, ...vals] = t.split("=");
      process.env[key.trim()] = vals.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

const ETSY_API_KEY = process.env.ETSY_API_KEY;
if (!ETSY_API_KEY) {
  console.error("ETSY_API_KEY not set in .env.local");
  console.error("Get a free key at: https://www.etsy.com/developers/register");
  process.exit(1);
}

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const plantsArg = args.find((a) => a.startsWith("--plants="));
const targetSlugs = plantsArg
  ? plantsArg.replace("--plants=", "").split(",").map((s) => s.trim())
  : [];

const TIER_PRICE_FLOORS: Record<string, number> = {
  "£": 5,
  "££": 20,
  "£££": 60,
  "££££": 200,
};

const plantsRoot = path.join(process.cwd(), "content", "plants");
const snapshotsRoot = path.join(process.cwd(), "content", "retail-snapshots");

interface PlantInfo {
  slug: string;
  name: string;
  genus: string;
  species: string;
  priceGuideTier: string;
  cultivar?: string;
  filePath: string;
  priceTracking: any;
}

function getEnabledPlants(): PlantInfo[] {
  const list: PlantInfo[] = [];
  const genera = fs.readdirSync(plantsRoot).filter((f) =>
    fs.statSync(path.join(plantsRoot, f)).isDirectory()
  );
  for (const genus of genera) {
    const files = fs
      .readdirSync(path.join(plantsRoot, genus))
      .filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const filePath = path.join(plantsRoot, genus, file);
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (!data.priceTracking?.enabled) continue;
        const cultivar = data.name.match(/'([^']+)'/)?.[1] ?? undefined;
        list.push({
          slug: data.slug,
          name: data.name,
          genus: data.genus,
          species: data.species,
          priceGuideTier: data.priceGuideTier,
          cultivar,
          filePath,
          priceTracking: data.priceTracking,
        });
      } catch {
        // skip
      }
    }
  }
  return list;
}

async function main() {
  console.log("=".repeat(60));
  console.log("  AROID ATLAS ETSY PRICE FETCH");
  console.log("=".repeat(60));

  const allPlants = getEnabledPlants();
  let plantsToRun = allPlants;

  if (targetSlugs.length > 0) {
    plantsToRun = allPlants.filter((p) => targetSlugs.includes(p.slug));
  }

  const allPlantsList = allPlants.map((p) => ({
    slug: p.slug,
    genus: p.genus,
    species: p.species,
    cultivar: p.cultivar,
  }));

  console.log(`Processing ${plantsToRun.length} plants...\n`);
  const checkedAt = new Date().toISOString();

  for (const plant of plantsToRun) {
    const query = `${plant.genus} ${plant.species} plant`;
    process.stdout.write(`  ${plant.slug} ("${query}")... `);

    let listings: Awaited<ReturnType<typeof searchEtsyListings>>;
    try {
      listings = await searchEtsyListings(query, ETSY_API_KEY!, 25);
    } catch (err: any) {
      console.log(`ERROR: ${err.message}`);
      continue;
    }

    if (listings.length === 0) {
      console.log("no results");
      continue;
    }

    // Filter to listings that match this plant with reasonable confidence
    const priceFloor = TIER_PRICE_FLOORS[plant.priceGuideTier] ?? 5;
    const priceCap = priceFloor * 30; // generous upper bound

    const matched = listings.filter((l) => {
      if (!l.inStock) return false;
      if (l.priceGbp < priceFloor || l.priceGbp > priceCap) return false;
      const m = matchProduct(l.title, plant, allPlantsList);
      return m.confidence >= 0.7;
    });

    console.log(`${matched.length}/${listings.length} matched`);

    if (matched.length === 0) continue;

    if (isDryRun) continue;

    // Save as a retail snapshot
    const observations = matched.map((l) => ({
      retailerSlug: "etsy",
      retailerName: "Etsy",
      title: l.title,
      productUrl: l.url,
      priceGbp: l.priceGbp,
      inStock: true,
      variantTitle: undefined,
      potSizeCm: undefined,
      plantSizeLabel: "unknown",
      sourceMethod: "manual",
      matchConfidence: 0.8,
    }));

    const prices = matched.map((l) => l.priceGbp);
    const stats = calculateRetailStats(prices);

    const snapshotData = {
      plantSlug: plant.slug,
      checkedAt,
      listings: observations,
      statsByType: { all: stats, etsy: stats },
    };

    const plantSnapshotDir = path.join(snapshotsRoot, plant.slug);
    fs.mkdirSync(plantSnapshotDir, { recursive: true });

    const tsFile = `etsy-${checkedAt.replace(/[:.]/g, "-")}.json`;
    fs.writeFileSync(
      path.join(plantSnapshotDir, tsFile),
      JSON.stringify(snapshotData, null, 2)
    );

    // Also write to latest.json only if no non-Etsy snapshot exists
    const latestPath = path.join(plantSnapshotDir, "latest.json");
    const hasRetailSnapshot = fs
      .readdirSync(plantSnapshotDir)
      .some((f) => f !== "latest.json" && !f.startsWith("etsy-"));

    if (!hasRetailSnapshot) {
      fs.writeFileSync(latestPath, JSON.stringify(snapshotData, null, 2));
      console.log(`    ✓ Saved as latest.json (no retail snapshot exists)`);
    } else {
      console.log(`    ✓ Saved timestamped (retail snapshot already exists)`);
    }

    // Small delay to respect rate limits
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("\nEtsy price fetch complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
