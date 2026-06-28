import fs from "fs";
import path from "path";

// simple dotenv parser
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

const contentPlantsRoot = path.join(process.cwd(), "content", "plants");

function getJsonFiles(dir: string): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getJsonFiles(filePath));
    } else if (file.endsWith(".json")) {
      results.push(filePath);
    }
  });
  return results;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateBlogForPlant(plantData: any, apiKey: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;

  // Deterministically request a typo for ~50% of the posts based on name length oddity
  const shouldInjectTypo = plantData.name.length % 2 !== 0;
  const typoInstruction = shouldInjectTypo
    ? "HUMAN TOUCH (TYPOS): You MUST inject exactly one subtle, natural spelling mistake or typo (e.g. 'seperate' instead of 'separate', 'definately' instead of 'definitely', 'unforseen' for 'unforeseen', 'occurence' for 'occurrence', 'temperment' for 'temperament', 'receving' for 'receiving', 'propogating' for 'propagating', 'carefull' for 'careful', or a missing letter like 'inflorescense'). Keep it extremely subtle and organic to make the writer feel like a real human typing notes in a humid greenhouse."
    : "HUMAN TOUCH: Write with perfect spelling and grammar, but maintain a casual, observational style.";

  const promptText = `
You are Aroid Aaron, a passionate, knowledgeable, and slightly eccentric British botanist/collector.
Your task is to write a short, authentic, and highly believable "Field Notes" blog entry for the tropical plant: ${plantData.name} (${plantData.scientificName}).

PLANT DATA (Use this as your strict source of truth. Do NOT make up leaf shape, texture, variegation, or origin details):
- Common Name: ${plantData.commonName || 'N/A'}
- Origin: ${plantData.origin || 'N/A'}
- About: ${plantData.aboutText || 'N/A'}
- Leaf Shape: ${plantData.morphology?.leafShape || 'N/A'}
- Leaf Texture: ${plantData.morphology?.texture || 'N/A'}
- Venation: ${plantData.morphology?.venation || 'N/A'}
- Variegation: ${plantData.morphology?.variegation || 'N/A'}
- Growth Habit: ${plantData.morphology?.growthHabit || 'N/A'}

STYLE & TONE GUIDELINES:
1. Write like a passionate British botanist/explorer. Use dry British humour, understated wit, and subtle self-deprecating notes. (e.g., mention hot cups of tea, drafty glasshouses, complaining about the British rain, or the utter madness of spending a small fortune on a single leaf).
2. Keep it concise: between 80 to 120 words.
3. Reference real botanical science or historical discovery context of this genus or plant. For example, refer to its habitat adaptations, taxonomic revisions, or discovery in the wild.
4. Do NOT write generic marketing copy or overly enthusiastic AI-sounding filler (avoid words like "testament", "delve", "elevate", "beacon", "masterclass", "revolution", "breathtaking", "ultimate"). Keep it grounded, observational, and scientific.
5. ${typoInstruction}

DATE REQUIREMENT:
- You must determine a realistic publication date for this blog post. This date should align with a major scientific description, collection event, description paper, or a high-profile discovery event of this plant.
- The date MUST be formatted as a string: YYYY-MM-DD.

Return ONLY a raw JSON object with no markdown code fences:
{
  "title": "A short, engaging title (dry, witty, or scientific, e.g. 'More Air Than Leaf' or 'A Rather Stiff Anomaly')",
  "date": "YYYY-MM-DD",
  "content": "Your blog post content here..."
}
  `.trim();

  const payload = {
    contents: [
      {
        parts: [
          {
            text: promptText,
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
    const errObj = {
      status: response.status,
      message: errorText
    };
    throw new Error(JSON.stringify(errObj));
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

  return JSON.parse(text);
}

async function generateBlogForPlantWithRetry(plantData: any, apiKey: string): Promise<any> {
  let retries = 5;
  let delay = 35000; // 35 seconds initial delay for rate limits

  while (retries > 0) {
    try {
      return await generateBlogForPlant(plantData, apiKey);
    } catch (err: any) {
      let isRateLimit = false;
      let errMsg = err.message;
      try {
        const parsedErr = JSON.parse(err.message);
        if (parsedErr.status === 429) {
          isRateLimit = true;
          errMsg = parsedErr.message;
        }
      } catch {
        if (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED")) {
          isRateLimit = true;
        }
      }

      if (isRateLimit) {
        console.warn(`    [!] Rate limited (429) for ${plantData.name}. Sleeping ${delay / 1000}s before retry... (${retries} retries left)`);
        await sleep(delay);
        retries--;
        delay = Math.min(delay * 1.5, 90000); // Back off up to 90 seconds
      } else {
        throw err;
      }
    }
  }
  throw new Error("Failed to generate blog post after multiple retries due to rate limit.");
}

async function main() {
  console.log("Starting Field Notes generator...");
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set in env or .env.local");
    process.exit(1);
  }

  const force = process.argv.includes("--force") || process.argv.includes("--all");
  const jsonFiles = getJsonFiles(contentPlantsRoot);
  console.log(`Found ${jsonFiles.length} plant JSON files to process.`);
  console.log(`Regeneration mode (--force): ${force}`);

  let updatedCount = 0;

  for (const filePath of jsonFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const plantData = JSON.parse(raw);

      // Check if it already has fieldNotes and we're not forcing regeneration
      if (!force && plantData.fieldNotes && plantData.fieldNotes.title && plantData.fieldNotes.content) {
        console.log(`[-] Skipping ${relativePath} — already has fieldNotes`);
        continue;
      }

      console.log(`[*] Generating Field Notes for ${plantData.name}...`);
      const blogData = await generateBlogForPlantWithRetry(plantData, apiKey);
      
      plantData.fieldNotes = {
        title: blogData.title,
        date: blogData.date,
        author: "Aroid Aaron",
        content: blogData.content
      };

      // Write back
      fs.writeFileSync(filePath, JSON.stringify(plantData, null, 2), "utf-8");
      console.log(`  ✓ Successfully wrote Field Notes for ${plantData.name} (${blogData.date})`);
      updatedCount++;

      // Sleep 5 seconds to naturally stay within free tier rate limit
      await sleep(5000);
    } catch (err) {
      console.error(`  [x] Failed to process ${relativePath}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`Field Notes generation completed. Updated ${updatedCount} files.`);
}

main().catch((err) => {
  console.error("Fatal generator error:", err);
  process.exit(1);
});
