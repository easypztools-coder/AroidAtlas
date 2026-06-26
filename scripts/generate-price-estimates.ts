/**
 * CLI: npx tsx scripts/generate-price-estimates.ts [--dry-run] [--plants=slug1,slug2]
 *
 * For every price-tracking-enabled plant that has no currentMedianPriceGBP,
 * asks Claude for a community-consensus GBP price estimate based on the
 * plant's species, rarity, origin, and tier.
 *
 * Writes back to the plant JSON as:
 *   marketMetrics.currentMedianPriceGBP  (number)
 *   marketMetrics.marketStatus           ("Stable" default)
 *   marketMetrics.estimatedSource        ("ai_estimate")
 *
 * These feed straight into the existing "AA Price" card via the
 * loadEmbeddedPriceHistory fallback in /api/plants/[slug]/price-history.
 */

import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";

// Load .env.local for API key
const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  for (const line of fs.readFileSync(envLocalPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=");
      process.env[key.trim()] = vals.join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  }
}

let client: Anthropic;

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const plantsArg = args.find((a) => a.startsWith("--plants="));
const targetSlugs = plantsArg
  ? plantsArg.replace("--plants=", "").split(",").map((s) => s.trim())
  : [];

const plantsRoot = path.join(process.cwd(), "content", "plants");

interface PlantData {
  slug: string;
  name: string;
  genus: string;
  species: string;
  rarityStatus: string;
  availability: string;
  priceGuideTier: string;
  origin: string;
  filePath: string;
  marketMetrics?: { currentMedianPriceGBP?: number };
  priceTracking?: { enabled: boolean };
}

function loadPlants(): PlantData[] {
  const plants: PlantData[] = [];
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
        plants.push({ ...data, filePath });
      } catch {
        console.warn(`Could not parse ${filePath}`);
      }
    }
  }
  return plants;
}

async function estimatePrice(plant: PlantData): Promise<number | null> {
  const prompt = `You are an expert in the UK rare houseplant market, specifically aroids (Araceae family).

Give me a single realistic GBP price estimate for the following plant as it would typically sell in the UK hobbyist/collector market today (2026). Consider TC plantlets, small plants, and established specimens — give the price a collector would typically pay for a decent mid-sized specimen.

Plant: ${plant.name}
Genus: ${plant.genus}
Species: ${plant.species}
Origin: ${plant.origin || "Tropical"}
Rarity status: ${plant.rarityStatus}
Availability: ${plant.availability}
Price tier (£/££/£££/££££): ${plant.priceGuideTier}

Respond with ONLY a JSON object like: {"price": 45, "reasoning": "one sentence"}
No markdown, no explanation outside the JSON.`;

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (msg.content[0] as { text: string }).text.trim();
    const parsed = JSON.parse(text);
    const price = Number(parsed.price);
    if (!isNaN(price) && price > 0) {
      return price;
    }
  } catch (err) {
    console.error(`  Error calling Claude for ${plant.slug}:`, err);
  }
  return null;
}

async function main() {
  client = new Anthropic();
  const allPlants = loadPlants();

  let toProcess = allPlants.filter(
    (p) =>
      p.priceTracking?.enabled &&
      !p.marketMetrics?.currentMedianPriceGBP
  );

  if (targetSlugs.length > 0) {
    toProcess = toProcess.filter((p) => targetSlugs.includes(p.slug));
  }

  console.log(`Plants needing estimates: ${toProcess.length}${isDryRun ? " (DRY RUN)" : ""}\n`);

  let updated = 0;
  let failed = 0;

  for (const plant of toProcess) {
    process.stdout.write(`  ${plant.slug} (${plant.priceGuideTier})... `);

    const price = await estimatePrice(plant);
    if (price === null) {
      console.log("FAILED");
      failed++;
      continue;
    }

    console.log(`£${price}`);

    if (!isDryRun) {
      const fileData = JSON.parse(fs.readFileSync(plant.filePath, "utf-8"));
      fileData.marketMetrics = {
        ...(fileData.marketMetrics ?? {}),
        currentMedianPriceGBP: price,
        marketStatus: fileData.marketMetrics?.marketStatus ?? null,
        threeMonthChangePercent: fileData.marketMetrics?.threeMonthChangePercent ?? null,
        estimatedSource: "ai_estimate",
      };
      fs.writeFileSync(plant.filePath, JSON.stringify(fileData, null, 2), "utf-8");
      updated++;
    }

    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\nDone. Updated: ${updated}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
