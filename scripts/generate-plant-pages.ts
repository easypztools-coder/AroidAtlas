/**
 * CLI tool: npx tsx scripts/generate-plant-pages.ts [--overwrite] [--dry-run]
 *
 * Scans the "Finished Plates" folder, cross-references files with existing pages
 * under content/plants/<genus>/, and uses Gemini 2.5 Flash Vision API to generate
 * structured JSON profiles for any new plants. It then copies the image to the
 * correct genus directory and writes the JSON page, fully integrating the new plant.
 */

import fs from "fs";
import path from "path";
import { PLANT_JSON_SCHEMA } from "./lib/plant-json-schema";

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const overwriteExisting = args.includes("--overwrite");

// Directory paths
const sourceDir = path.join(process.cwd(), "Finished Plates");
const contentPlantsRoot = path.join(process.cwd(), "content", "plants");
const publicPlantsRoot = path.join(process.cwd(), "public", "plants");

// Hardcoded files to skip because they already have manually tuned content on the site
const SKIPPED_FILES = new Set([
  "Anthurium 'Delta Force'.png",
  "Monstera 'Burle Marx Flame'.png",
  "Monstera 'Devil Monster'.png",
  "Spiritus Sancti.png",
  "Philodendron spiritus-sancti.png",
  // Duplicate plate — page already exists as caramel-marble.json
  "Philodendron 'Caramel Marble' (1).png",
  // Duplicate plate — original Monstera pinnatipartita.png exists and will be processed
  "Monstera pinnatipartita (1).png",
  // Jun 30 within-batch duplicates — older-style plates, canonical plates are from later batches
  "Philodendron melanochrysum (alt).png",
  "Philodendron erubescens 'Pink Princess' (alt).png",
  "Philodendron 'Florida Ghost' (alt).png",
]);

// Simple dotenv parser
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

function getGenusFromFilename(filename: string): string | null {
  const lower = filename.toLowerCase();
  if (lower.startsWith("alocasia")) return "alocasia";
  if (lower.startsWith("anthurium")) return "anthurium";
  if (lower.startsWith("monstera")) return "monstera";
  if (lower.startsWith("philodendron")) return "philodendron";
  if (lower.startsWith("begonia")) return "begonia";
  return "other";
}

function getSlugCandidateFromFilename(filename: string, genus: string): string {
  let base = path.basename(filename, path.extname(filename));
  if (base.toLowerCase().startsWith(genus.toLowerCase())) {
    base = base.substring(genus.length).trim();
  }
  if (base.startsWith("x ") || base.startsWith("× ")) {
    base = base.substring(2).trim();
  }
  let slug = base.toLowerCase()
    .replace(/['"()]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  
  if (slug === "ilsemanii-variegata") return "ilsemannii-variegata";
  if (slug === "ilsemanii-variegated") return "ilsemannii-variegated";
  return slug;
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

// Prompt for Gemini to generate the correct plant JSON structure
const JSON_PROMPT = `
You are a botanical data extractor for Aroid Atlas. Your task is to analyze the provided botanical plate image and extract its details into the exact JSON schema defined below.
${PLANT_JSON_SCHEMA}`;

async function generatePlantJson(filePath: string, apiKey: string): Promise<any> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString("base64");
  const mimeType = getMimeType(filePath);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: JSON_PROMPT,
          },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
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

  // Strip markdown code fences if Gemini returned them
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
  console.log("  PLANT PAGE GENERATION & INTEGRATION PIPELINE");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("⚠️ RUNNING IN DRY-RUN MODE: No files will be copied or written.\n");
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set in env or .env.local");
    process.exit(1);
  }

  if (!fs.existsSync(sourceDir)) {
    console.error(`Error: Finished Plates folder does not exist at "${sourceDir}"`);
    process.exit(1);
  }

  const files = fs.readdirSync(sourceDir).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return (ext === ".png" || ext === ".jpg" || ext === ".jpeg") && fs.statSync(path.join(sourceDir, file)).isFile();
  });

  if (files.length === 0) {
    console.log("No images found in Finished Plates folder.");
    return;
  }

  console.log(`Found ${files.length} plates in Finished Plates folder.\n`);

  for (const file of files) {
    const fullPath = path.join(sourceDir, file);
    
    // Check if skipped
    if (SKIPPED_FILES.has(file)) {
      console.log(`[-] Skipping core existing file: "${file}"`);
      continue;
    }

    // Skip unrenamed files
    if (file.startsWith("ChatGPT Image")) {
      console.log(`[-] Skipping unrenamed ChatGPT image: "${file}"`);
      continue;
    }

    const genus = getGenusFromFilename(file);
    if (!genus) {
      console.log(`[!] Warning: Could not detect genus for filename "${file}". Skipping.`);
      continue;
    }

    console.log(`\n------------------------------------------------------------`);
    console.log(`Processing: "${file}" (Genus: ${genus})`);
    console.log(`------------------------------------------------------------`);

    // Early skip check by predicting the slug and checking if the file already exists
    const slugCandidate = getSlugCandidateFromFilename(file, genus);
    const slugVariegated = slugCandidate.replace(/variegata/g, "variegated");
    const slugVariegata = slugCandidate.replace(/variegated/g, "variegata");
    const pathVariegated = path.join(contentPlantsRoot, genus, `${slugVariegated}.json`);
    const pathVariegata = path.join(contentPlantsRoot, genus, `${slugVariegata}.json`);
    if ((fs.existsSync(pathVariegated) || fs.existsSync(pathVariegata)) && !overwriteExisting) {
      console.log(`[-] Page already exists at content/plants/${genus}/${slugVariegated}.json (or variegata). Skipping.`);
      continue;
    }

    try {
      console.log("  Extracting botanical data via Gemini Vision API...");
      const plantData = await generatePlantJson(fullPath, apiKey);
      // Sleep for 5 seconds to prevent rate limits
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Map Variegata -> Variegated
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
        plantData.priceTracking.acceptedTerms = plantData.priceTracking.acceptedTerms.map((t: string) => t.replace(/Variegata/g, "Variegated").replace(/variegata/g, "variegated"));
      }

      // Ensure that for "other" genus, the slug is prefixed with the actual plant genus
      if (genus === "other") {
        const actualGenus = (plantData.genus || "").toLowerCase();
        if (actualGenus && !plantData.slug.startsWith(actualGenus)) {
          plantData.slug = `${actualGenus}-${plantData.slug}`;
        }
      }

      const slug = plantData.slug;
      
      if (!slug) {
        console.error("  [!] Error: Gemini output did not contain a valid slug.");
        continue;
      }

      console.log(`  ✓ Extracted plant: "${plantData.name}"`);
      console.log(`  ✓ Decided slug:    "${slug}"`);

      const slugVariegated = slug.replace(/variegata/g, "variegated");
      const slugVariegata = slug.replace(/variegated/g, "variegata");

      const targetJsonPathVariegated = path.join(contentPlantsRoot, genus, `${slugVariegated}.json`);
      const targetJsonPathVariegata = path.join(contentPlantsRoot, genus, `${slugVariegata}.json`);
      const targetPngPath = path.join(publicPlantsRoot, genus, `${slugVariegated}.png`);

      const jsonExists = fs.existsSync(targetJsonPathVariegated) || fs.existsSync(targetJsonPathVariegata);

      if (jsonExists && !overwriteExisting) {
        console.log(`  [-] Page already exists at content/plants/${genus}/${slugVariegated}.json (or variegata). Skipping (use --overwrite to force update).`);
        continue;
      }

      // If writing new page, save as the variegated slug format (canonical)
      const targetJsonPath = targetJsonPathVariegated;

      if (isDryRun) {
        console.log(`  [Dry Run] Would write JSON to: content/plants/${genus}/${slug}.json`);
        console.log(`  [Dry Run] Would copy image to: public/plants/${genus}/${slug}.png`);
      } else {
        // Ensure genus directories exist for both JSON and image
        fs.mkdirSync(path.dirname(targetJsonPath), { recursive: true });
        fs.mkdirSync(path.dirname(targetPngPath), { recursive: true });

        // Write JSON
        fs.writeFileSync(targetJsonPath, JSON.stringify(plantData, null, 2), "utf-8");
        console.log(`  ✓ Wrote JSON details:  content/plants/${genus}/${slug}.json`);

        // Copy Image
        fs.copyFileSync(fullPath, targetPngPath);
        console.log(`  ✓ Copied plate image:  public/plants/${genus}/${slug}.png`);
      }
    } catch (err) {
      console.error(`  [x] Failed to process "${file}":`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Plant integration run completed.");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal workflow error:", err);
  process.exit(1);
});
