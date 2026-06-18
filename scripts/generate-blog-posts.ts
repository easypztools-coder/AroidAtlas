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

async function generateBlogForPlant(plantName: string, scientificName: string, apiKey: string): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const promptText = `
You are Aaron, a passionate botanical explorer and blogger for Aroid Atlas.
Your task is to write a short, authentic, and highly believable "Field Notes" blog entry for the tropical plant: ${plantName} (${scientificName}).

STYLE & TONE:
- Write like a knowledgeable, slightly eccentric British botanist/collector.
- Keep it concise: between 80 to 120 words.
- Focus on intellectual interest, scientific history, and botanical curiosity. Do NOT write generic marketing copy or overly enthusiastic AI-sounding filler (avoid words like "testament", "delve", "elevate", "beacon").
- Make it sound like a quick note written in a field journal or a personal blog post.
- You must reference real scientific findings, the original discovery context, or the abstract of an actual scientific paper or historical blog post about this exact plant (e.g., its naming, a key morphological study, or its discovery in the wild).

DATE REQUIREMENT:
- You must determine a realistic publication date for this blog post. This date should align with a major scientific paper publication, description, or high-profile discovery event of this plant.
- The date MUST be formatted as a string: YYYY-MM-DD.

Return ONLY a raw JSON object with no markdown code fences:
{
  "title": "A short, engaging title (e.g. 'Hunting the Ghost of Espírito Santo' or 'The Deltoid Anomaly')",
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
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
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

async function main() {
  console.log("Starting Field Notes generator...");
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY is not set in env or .env.local");
    process.exit(1);
  }

  const jsonFiles = getJsonFiles(contentPlantsRoot);
  console.log(`Found ${jsonFiles.length} plant JSON files to process.`);

  for (const filePath of jsonFiles) {
    const relativePath = path.relative(process.cwd(), filePath);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const plantData = JSON.parse(raw);

      // Check if it already has fieldNotes
      if (plantData.fieldNotes && plantData.fieldNotes.title && plantData.fieldNotes.content) {
        console.log(`[-] Skipping ${relativePath} — already has fieldNotes`);
        continue;
      }

      console.log(`[*] Generating Field Notes for ${plantData.name}...`);
      const blogData = await generateBlogForPlant(plantData.name, plantData.scientificName, apiKey);
      
      plantData.fieldNotes = {
        title: blogData.title,
        date: blogData.date,
        author: "Aaron",
        content: blogData.content
      };

      // Write back
      fs.writeFileSync(filePath, JSON.stringify(plantData, null, 2), "utf-8");
      console.log(`  ✓ Successfully wrote Field Notes for ${plantData.name} (${blogData.date})`);

      // Sleep a bit to avoid rate limits
      await sleep(1000);
    } catch (err) {
      console.error(`  [x] Failed to process ${relativePath}:`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log("Field Notes generation completed.");
}

main().catch((err) => {
  console.error("Fatal generator error:", err);
  process.exit(1);
});
