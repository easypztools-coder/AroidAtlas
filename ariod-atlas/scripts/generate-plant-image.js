#!/usr/bin/env node

const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");

const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("Error: OPENROUTER_API_KEY environment variable is not set.");
  process.exit(1);
}

const slug = process.argv[2];
if (!slug) {
  console.error("Error: Please provide a plant slug as the first argument.");
  console.error("Usage: node scripts/generate-plant-image.js <slug>");
  process.exit(1);
}

// Load the plant dataset to get the display name
const datasetPath = path.resolve(
  __dirname,
  "..",
  "content",
  "plants",
  "philodendron",
  `${slug}.json`
);

let plantName;
try {
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  plantName = dataset.commonName || dataset.name;
} catch (err) {
  console.error(`Error: Could not load dataset for slug "${slug}".`, err.message);
  process.exit(1);
}

// Construct the prompt using the aesthetic formula
const prompt = `${plantName}, isolated high-fidelity studio botanical illustration plate. Crisp macro photography. Single mature plant growing vertically on a clean moss pole, planted inside a clear minimalist glass cylinder pot filled with premium aroid bark mix. Completely clean, solid off-white parchment paper background (#F2F1EC). Soft flat professional studio lighting, hyper-detailed vein textures, zero shadows, high contrast, scientific atlas style, shot on 35mm lens, f/8 aperture for deep focus, 8k resolution.`;

const requestBody = JSON.stringify({
  model: "black-forest-labs/flux-1-schnell",
  messages: [
    {
      role: "user",
      content: prompt,
    },
  ],
  // Aspect ratio for vertical composition
  // The flux-1-schnell model supports image generation config
  // We use the provider's image output format
  response_format: "url",
});

const options = {
  hostname: "openrouter.ai",
  path: "/api/v1/chat/completions",
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
};

console.log(`Generating image for "${plantName}"...`);

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    try {
      const response = JSON.parse(data);

      // The response may contain an image URL in the content
      const content = response.choices?.[0]?.message?.content;

      if (!content) {
        console.error("Error: No content in API response.");
        console.error("Response:", JSON.stringify(response, null, 2));
        process.exit(1);
      }

      // The content is typically a markdown image URL: ![image](url)
      const urlMatch = content.match(/!\[.*?\]\((.*?)\)/);
      const imageUrl = urlMatch ? urlMatch[1] : content.trim();

      if (!imageUrl || !imageUrl.startsWith("http")) {
        console.error("Error: Could not extract image URL from response.");
        console.error("Content:", content);
        process.exit(1);
      }

      console.log(`Downloading image from: ${imageUrl}`);

      // Ensure the output directory exists
      const outputDir = path.resolve(__dirname, "..", "public", "images", "plants");
      fs.mkdirSync(outputDir, { recursive: true });

      const outputPath = path.join(outputDir, `${slug}.jpg`);

      // Download the image binary
      https.get(imageUrl, (imageRes) => {
        const fileStream = fs.createWriteStream(outputPath);
        imageRes.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          console.log(`Image saved to: ${outputPath}`);
        });
      }).on("error", (err) => {
        console.error("Error downloading image:", err.message);
        process.exit(1);
      });
    } catch (err) {
      console.error("Error parsing API response:", err.message);
      console.error("Raw response:", data);
      process.exit(1);
    }
  });
});

req.on("error", (err) => {
  console.error("Error making API request:", err.message);
  process.exit(1);
});

req.write(requestBody);
req.end();