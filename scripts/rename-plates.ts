/**
 * CLI tool: npx tsx scripts/rename-plates.ts [--dry-run] [--force-api]
 *
 * Scans the "Finished Plates" directory for files matching "ChatGPT Image"
 * and renames them to the plant names written on the botanical plates.
 * Uses a hardcoded mapping for existing files to save API calls, and
 * falls back to Gemini 2.5 Flash Vision API for new or unrecognized files.
 */

import fs from "fs";
import path from "path";

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const forceApi = args.includes("--force-api");

// Directory paths
const targetDir = path.join(process.cwd(), "Finished Plates");

// Hardcoded fallback mapping to save API requests and handle current files out of the box
const HARDCODED_MAP: Record<string, string> = {
  "ChatGPT Image Jun 13, 2026, 11_26_17 PM.png": "Monstera 'Devil Monster'",
  "ChatGPT Image Jun 13, 2026, 11_51_14 PM.png": "Alocasia sp.",
  "ChatGPT Image Jun 14, 2026, 10_33_24 PM.png": "Anthurium 'Delta Force'",
  "ChatGPT Image Jun 14, 2026, 12_06_18 AM.png": "Alocasia sp.",
  "ChatGPT Image Jun 17, 2026, 10_50_44 PM.png": "Monstera 'Burle Marx Flame'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (1).png": "Philodendron x joepii 'Aurea Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (1) (1).png": "Philodendron x joepii 'Aurea Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (2).png": "Philodendron ilsemanii 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (2) (1).png": "Philodendron ilsemanii 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (3).png": "Philodendron patriciae 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (3) (1).png": "Philodendron patriciae 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (4).png": "Philodendron 'Whipple Way'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (4) (1).png": "Philodendron 'Whipple Way'",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (5).png": "Monstera obliqua (Peru form)",
  "ChatGPT Image Jun 18, 2026, 05_32_37 PM (5) (1).png": "Monstera obliqua (Peru form)",
  "ChatGPT Image Jun 18, 2026, 05_32_38 PM (5).png": "Monstera obliqua (Peru form)",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (1).png": "Anthurium papillilaminum 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (2).png": "Anthurium luxurians 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (3).png": "Anthurium 'Ace of Spades' Variegata",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (4).png": "Alocasia reginula 'Black Velvet' Pink Albo Variegata",
  "ChatGPT Image Jun 18, 2026, 05_32_51 PM (5).png": "Alocasia cuprea 'Pink Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (1).png": "Anthurium papillilaminum 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (2).png": "Anthurium luxurians 'Variegata'",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (3).png": "Anthurium 'Ace of Spades' Variegata",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (4).png": "Alocasia reginula 'Black Velvet' Pink Albo Variegata",
  "ChatGPT Image Jun 18, 2026, 05_33_02 PM (5).png": "Alocasia cuprea 'Pink Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (1).png": "Philodendron mexicanum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (2).png": "Philodendron lupinum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (3).png": "Anthurium forgetii 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (4).png": "Monstera pinnatipartita 'Albo Variegata'",
  "ChatGPT Image Jun 19, 2026, 09_51_50 PM (5).png": "Alocasia baginda 'Dragon Scale' Albo Variegata",
  "ChatGPT Image Jun 19, 2026, 10_06_10 PM.png": "Philodendron atabapoense 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_06_20 PM (2).png": "Philodendron verrucosum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_06_21 PM (3).png": "Anthurium regale 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_06_21 PM (4).png": "Monstera dubia 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_06_21 PM (5).png": "Alocasia azlanii 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_11_55 PM (1).png": "Philodendron sodiroi 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_11_55 PM (2).png": "Anthurium dressleri 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_11_56 PM (3).png": "Monstera siltepecana 'El Salvador Form'",
  "ChatGPT Image Jun 19, 2026, 10_11_56 PM (4).png": "Alocasia nebula 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_11_56 PM (5).png": "Philodendron nangaritense 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_45 PM (1).png": "Philodendron melanochrysum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_45 PM (2).png": "Philodendron camposportoanum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_46 PM (5).png": "Anthurium magnificum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_46 PM (6).png": "Anthurium vittariifolium 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_47 PM (7).png": "Monstera standleyana 'Aurea Variegated'",
  "ChatGPT Image Jun 19, 2026, 10_27_47 PM (8).png": "Rhaphidophora cryptantha 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_47 PM (9).png": "Alocasia longiloba 'Watsoniana Pink Doff Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_27_48 PM (10).png": "Scindapsus treubii 'Moonlight Variegated'",
  "ChatGPT Image Jun 19, 2026, 10_28_53 PM (1).png": "Anthurium crystallinum 'Variegata'",
  "ChatGPT Image Jun 19, 2026, 10_28_53 PM (2).png": "Philodendron gloriosum 'Tricolor'",
};

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
// Clean plant name for use as a safe filename
function sanitizeFilename(name: string): string {
  // Remove formatting characters, quotes, or trailing/leading periods if necessary,
  // but keep single quotes since they are common in cultivar names (e.g. 'Devil Monster')
  let cleaned = name.replace(/[\\/:*?"<>|]/g, "").trim();
  // Strip enclosing quotes if they got returned by the LLM
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.substring(1, cleaned.length - 1).trim();
  }
  // Remove trailing dots to prevent issues like "Alocasia sp..png"
  while (cleaned.endsWith(".")) {
    cleaned = cleaned.slice(0, -1).trim();
  }
  return cleaned;
}// Check mime type from extension
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "image/png";
}

// Make a Vision API request to Gemini to identify the plant name
async function queryGeminiVision(filePath: string, apiKey: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const base64Data = fileBuffer.toString("base64");
  const mimeType = getMimeType(filePath);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: "Identify the plant name from this botanical plate. Look at the large text headers, scientific name, or species/cultivar sections. Return ONLY the plant name itself (e.g. \"Monstera 'Devil Monster'\" or \"Philodendron x joepii 'Aurea Variegata'\"). Do not include any explanation, intro, markdown formatting, or enclosing quotes.",
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
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error(`Invalid response shape from Gemini: ${JSON.stringify(json)}`);
  }

  return text.trim();
}

// Helper to find a non-colliding filename
function findUniquePath(dir: string, baseName: string, ext: string, allocated: Set<string>): string {
  let candidate = path.join(dir, `${baseName}${ext}`);
  if (!fs.existsSync(candidate) && !allocated.has(candidate)) {
    allocated.add(candidate);
    return candidate;
  }

  let counter = 1;
  while (true) {
    candidate = path.join(dir, `${baseName} (${counter})${ext}`);
    if (!fs.existsSync(candidate) && !allocated.has(candidate)) {
      allocated.add(candidate);
      return candidate;
    }
    counter++;
  }
}

async function main() {
  console.log("=".repeat(60));
  console.log("  BOTANICAL PLATE RENAMING TOOL");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("⚠️ RUNNING IN DRY-RUN MODE: No files will actually be renamed.\n");
  }

  if (!fs.existsSync(targetDir)) {
    console.error(`Error: Directory does not exist at "${targetDir}"`);
    process.exit(1);
  }

  const apiKey = getApiKey();
  if (!apiKey && forceApi) {
    console.error("Error: --force-api requires GEMINI_API_KEY to be set in env or .env.local");
    process.exit(1);
  }

  const files = fs.readdirSync(targetDir).filter((file) => {
    return file.startsWith("ChatGPT Image") && fs.statSync(path.join(targetDir, file)).isFile();
  });

  if (files.length === 0) {
    console.log("No new 'ChatGPT Image' files found in Finished Plates folder.");
    return;
  }

  console.log(`Found ${files.length} images to process.\n`);

  const allocatedPaths = new Set<string>();

  for (const file of files) {
    const fullPath = path.join(targetDir, file);
    const ext = path.extname(file);
    let plantName: string | null = null;

    console.log(`Processing: "${file}"`);

    // Step 1: Check if we can use hardcoded mapping
    if (HARDCODED_MAP[file] && !forceApi) {
      plantName = sanitizeFilename(HARDCODED_MAP[file]);
      console.log(`  ✓ Found in local database: "${plantName}"`);
    } else {
      // Step 2: Use Gemini API if available
      if (apiKey) {
        try {
          console.log("  Calling Gemini Vision API...");
          const identifiedName = await queryGeminiVision(fullPath, apiKey);
          plantName = sanitizeFilename(identifiedName);
          console.log(`  ✓ Gemini identified: "${plantName}"`);
          // Sleep for 5 seconds to prevent hitting rate limits
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (err) {
          console.error(`  ✗ Gemini vision call failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        console.log("  ⚠️ No GEMINI_API_KEY found. Skipping Gemini Vision call.");
      }
    }

    if (!plantName) {
      console.log(`  ⚠️ Skipping file (could not resolve name).\n`);
      continue;
    }

    // Step 3: Determine destination
    const destPath = findUniquePath(targetDir, plantName, ext, allocatedPaths);
    const destName = path.basename(destPath);

    console.log(`  Destination: "${destName}"`);

    if (!isDryRun) {
      try {
        fs.renameSync(fullPath, destPath);
        console.log("  ✓ Successfully renamed.");
      } catch (err) {
        console.error(`  ✗ Rename failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    console.log("");
  }

  console.log("=".repeat(60));
  console.log("Plate renaming run completed.");
  console.log("=".repeat(60));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
