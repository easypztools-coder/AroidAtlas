/**
 * CLI tool: npx tsx scripts/generate-simplified-plants.ts [--input=path] [--dry-run] [--overwrite]
 *
 * Reads a newline-delimited list of plant names (no source image required) and
 * uses Gemini text-only inference to generate structured JSON profiles, the same
 * way generate-plant-pages.ts does from a botanical plate photo. Writes ONLY the
 * JSON page (contentTier: "sketch") — no PNG, no Finished Plates/ involvement.
 * The site renders a templated SimplifiedPlateCard in place of a plate image for
 * these entries.
 *
 * Input file format (default: scripts/input/simplified-plants.txt), one per line:
 *   Genus species 'Cultivar Name'
 *   Genus species 'Cultivar Name' | genus-override
 */

import fs from "fs";
import path from "path";
import { PLANT_JSON_SCHEMA } from "./lib/plant-json-schema";

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const overwriteExisting = args.includes("--overwrite");
const inputArg = args.find((a) => a.startsWith("--input="));
const inputPath = inputArg
  ? path.resolve(process.cwd(), inputArg.substring("--input=".length))
  : path.join(process.cwd(), "scripts", "input", "simplified-plants.txt");

const contentPlantsRoot = path.join(process.cwd(), "content", "plants");

const KNOWN_GENERA = new Set(["alocasia", "anthurium", "monstera", "philodendron", "begonia"]);

// Simple dotenv parser (mirrors generate-plant-pages.ts)
function getApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY) {
    return process.env.GEMINI_API_KEY;
  }
  const envPath = path.join(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("GEMINI_API_KEY=")) {
        return trimmed.substring("GEMINI_API_KEY=".length).replace(/['"]/g, "").trim();
      }
    }
  }
  return undefined;
}

function getGenusFromName(name: string): string {
  const firstWord = name.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  return KNOWN_GENERA.has(firstWord) ? firstWord : "other";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/['"()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface InputEntry {
  name: string;
  genusOverride?: string;
}

function parseInputFile(filePath: string): InputEntry[] {
  const raw = fs.readFileSync(filePath, "utf-8");
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const [namePart, genusPart] = line.split("|").map((s) => s.trim());
      return {
        name: namePart,
        genusOverride: genusPart ? genusPart.toLowerCase() : undefined,
      };
    });
}

function buildTextPrompt(plantName: string): string {
  return `
You are a botanical data extractor for Aroid Atlas. No reference image is available for this entry.

Based solely on the plant name "${plantName}" and your knowledge of aroid horticulture, infer realistic values for every field in the exact JSON schema below. Where specific data (dimensions, price tier, rarity) is not confidently known, infer plausible values consistent with this species/cultivar's known characteristics — never leave fields blank.
${PLANT_JSON_SCHEMA}`;
}

async function generateSimplifiedPlantJson(plantName: string, apiKey: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: buildTextPrompt(plantName),
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const json = (await response.json()) as any;
  let text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Invalid response shape from Gemini: ${JSON.stringify(json)}`);
  }

  text = text.trim();
  if (text.startsWith("```json")) {
    text = text.substring(7);
  } else if (text.startsWith("```")) {
    text = text.substring(3);
  }
  if (text.endsWith("```")) {
    text = text.substring(0, text.length - 3);
  }
  text = text.trim();

  try {
    return JSON.parse(text);
  } catch (err) {
    console.error("Failed to parse Gemini response as JSON. Response text was:\n", text);
    throw err;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  SIMPLIFIED (FIELD SKETCH) PLANT PAGE GENERATION");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("⚠️ RUNNING IN DRY-RUN MODE: No files will be written.\n");
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set in env or .env.local");
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error(`Error: Input file does not exist at "${inputPath}"`);
    console.error(`Create it (one plant name per line) or pass --input=<path>.`);
    process.exit(1);
  }

  const entries = parseInputFile(inputPath);
  if (entries.length === 0) {
    console.log("No plant names found in input file.");
    return;
  }

  console.log(`Found ${entries.length} plant name(s) in "${inputPath}".\n`);

  for (const entry of entries) {
    const genus = entry.genusOverride ?? getGenusFromName(entry.name);

    console.log(`\n------------------------------------------------------------`);
    console.log(`Processing: "${entry.name}" (Genus: ${genus})`);
    console.log(`------------------------------------------------------------`);

    try {
      console.log("  Inferring botanical data via Gemini (text-only)...");
      const plantData = await generateSimplifiedPlantJson(entry.name, apiKey);
      // Sleep for 5 seconds to prevent rate limits
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Map Variegata -> Variegated (mirrors generate-plant-pages.ts normalization)
      if (plantData.name) {
        plantData.name = plantData.name.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated");
      }
      if (plantData.scientificName) {
        plantData.scientificName = plantData.scientificName.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated");
      }
      if (plantData.commonName) {
        plantData.commonName = plantData.commonName.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated");
      }
      if (plantData.slug) {
        plantData.slug = plantData.slug.replace(/variegata/g, "variegated");
      }
      if (plantData.species) {
        plantData.species = plantData.species.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated");
      }
      if (plantData.statusTag) {
        plantData.statusTag = plantData.statusTag.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated");
      }
      if (plantData.aboutText) {
        plantData.aboutText = plantData.aboutText.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated");
      }
      if (plantData.morphology && plantData.morphology.variegation) {
        plantData.morphology.variegation = plantData.morphology.variegation.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated");
      }
      if (plantData.priceTracking && plantData.priceTracking.query) {
        plantData.priceTracking.query = plantData.priceTracking.query.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated");
      }
      if (plantData.priceTracking && plantData.priceTracking.acceptedTerms) {
        plantData.priceTracking.acceptedTerms = plantData.priceTracking.acceptedTerms.map((t: string) =>
          t.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated")
        );
      }

      // Ensure that for "other" genus, the slug is prefixed with the actual plant genus
      if (genus === "other") {
        const actualGenus = (plantData.genus || "").toLowerCase();
        if (actualGenus && !plantData.slug.startsWith(actualGenus)) {
          plantData.slug = `${actualGenus}-${plantData.slug}`;
        }
      }

      let slug: string = plantData.slug || slugify(entry.name);
      if (!slug) {
        console.error("  [!] Error: Gemini output did not contain a valid slug.");
        continue;
      }

      plantData.contentTier = "sketch";

      console.log(`  ✓ Inferred plant: "${plantData.name}"`);
      console.log(`  ✓ Decided slug:   "${slug}"`);

      const slugVariegated = slug.replace(/variegata/g, "variegated");
      const slugVariegata = slug.replace(/variegated/g, "variegata");

      const targetJsonPathVariegated = path.join(contentPlantsRoot, genus, `${slugVariegated}.json`);
      const targetJsonPathVariegata = path.join(contentPlantsRoot, genus, `${slugVariegata}.json`);

      const jsonExists = fs.existsSync(targetJsonPathVariegated) || fs.existsSync(targetJsonPathVariegata);

      if (jsonExists && !overwriteExisting) {
        console.log(`  [-] Page already exists at content/plants/${genus}/${slugVariegated}.json (or variegata). Skipping (use --overwrite to force update).`);
        continue;
      }

      const targetJsonPath = targetJsonPathVariegated;

      if (isDryRun) {
        console.log(`  [Dry Run] Would write JSON to: content/plants/${genus}/${slugVariegated}.json`);
      } else {
        fs.mkdirSync(path.dirname(targetJsonPath), { recursive: true });
        fs.writeFileSync(targetJsonPath, JSON.stringify(plantData, null, 2), "utf-8");
        console.log(`  ✓ Wrote JSON details: content/plants/${genus}/${slugVariegated}.json`);
      }
    } catch (err) {
      console.error(`  [x] Failed to process "${entry.name}":`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Simplified plant generation run completed.");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal workflow error:", err);
  process.exit(1);
});
