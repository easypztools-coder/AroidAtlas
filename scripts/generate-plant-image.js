#!/usr/bin/env node

const https = require("node:https");
const fs = require("node:fs");
const path = require("node:path");

// Try environment variable first, then fall back to .env.local
let API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  try {
    const envPath = path.resolve(__dirname, "..", ".env.local");
    const envContent = fs.readFileSync(envPath, "utf-8");
    const match = envContent.match(/^OPENROUTER_API_KEY=(.+)$/m);
    if (match) {
      API_KEY = match[1].trim();
    }
  } catch {
    // .env.local not found, continue without it
  }
}

const TIMEOUT_MS = 300_000; // 5 minute timeout

if (!API_KEY) {
  console.error("Error: OPENROUTER_API_KEY environment variable is not set.");
  console.error("Set it in .env.local or pass as environment variable.");
  process.exit(1);
}

const slug = process.argv[2];
if (!slug) {
  console.error("Error: Please provide a plant slug as the first argument.");
  console.error("Usage: node scripts/generate-plant-image.js <slug>");
  process.exit(1);
}

// Load the plant dataset
const datasetPath = path.resolve(
  __dirname,
  "..",
  "content",
  "plants",
  "philodendron",
  `${slug}.json`
);

let scientificName;
try {
  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf-8"));
  scientificName = dataset.scientificName || dataset.name;
} catch (err) {
  console.error(`Error: Could not load dataset for slug "${slug}".`, err.message);
  process.exit(1);
}

const prompt = `${scientificName}, isolated high-fidelity studio botanical illustration plate. Crisp macro photography. Single mature plant growing vertically on a clean moss pole, planted inside a clear minimalist glass cylinder pot filled with premium aroid bark mix. Completely clean, solid off-white parchment paper background (#F2F1EC). Soft flat professional studio lighting, hyper-detailed vein textures, zero shadows, high contrast, scientific atlas style, shot on 35mm lens, f/8 aperture for deep focus, 8k resolution. 3:4 aspect ratio, vertical composition.`;

const requestBody = JSON.stringify({
  model: "openai/gpt-5-image-mini",
  messages: [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt,
        },
      ],
    },
  ],
  modalities: ["image"],
});

const options = {
  hostname: "openrouter.ai",
  path: "/api/v1/chat/completions",
  method: "POST",
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(requestBody),
    "HTTP-Referer": "https://ariodatlas.com",
    "X-Title": "Ariod Atlas",
  },
  timeout: TIMEOUT_MS,
};

console.log(`Generating image for "${scientificName}" (slug: ${slug})...`);
console.log(`Using model: openai/gpt-5-image-mini`);
console.log(`Timeout: ${TIMEOUT_MS / 1000}s`);
console.log("");

const startTime = Date.now();

const req = https.request(options, (res) => {
  console.log(`Response status: ${res.statusCode} ${res.statusMessage}`);

  let data = "";
  res.setEncoding("utf8");

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`Response received in ${elapsed}s`);

    if (!data) {
      console.error("Error: Empty response from API.");
      process.exit(1);
    }

    try {
      const response = JSON.parse(data);

      if (response.error) {
        console.error("API Error:", JSON.stringify(response.error, null, 2));
        process.exit(1);
      }

      // Parse the response for image data
      let imageData = null;
      let imageUrl = null;

      const choices = response.choices || [];
      if (choices.length > 0) {
        const message = choices[0].message || {};

        // Format 1: Content is an array with image_url parts containing base64 data
        if (Array.isArray(message.content)) {
          for (const part of message.content) {
            if (part.type === "image_url" && part.image_url?.url) {
              const url = part.image_url.url;
              if (url.startsWith("data:")) {
                imageData = url;
                break;
              } else {
                imageUrl = url;
              }
            }
          }
        }

        // Format 2: content is a string - check for data URI, URL, or raw base64
        if (!imageData && !imageUrl && typeof message.content === "string") {
          if (message.content.startsWith("data:")) {
            imageData = message.content;
          } else if (message.content.startsWith("http")) {
            imageUrl = message.content;
          } else if (message.content.length > 1000) {
            // Likely raw base64 image data
            console.log(`Detected raw base64 content (${message.content.length} chars)`);
            imageData = message.content;
          }
        }

        // Format 3: Check for images array on message
        if (!imageData && !imageUrl && Array.isArray(message.images)) {
          console.log(`Found images array with ${message.images.length} item(s)`);
          for (const img of message.images) {
            console.error("Image item full:", JSON.stringify(img).substring(0, 200));
            if (typeof img === "string") {
              if (img.startsWith("data:") || img.length > 1000) {
                imageData = img;
                break;
              } else if (img.startsWith("http")) {
                imageUrl = img;
                break;
              }
            } else if (typeof img === "object" && img !== null) {
              // Try image_url sub-object first (common pattern)
              if (img.image_url?.url) {
                const url = img.image_url.url;
                if (url.startsWith("data:") || url.length > 100) {
                  imageData = url;
                  break;
                } else if (url.startsWith("http")) {
                  imageUrl = url;
                  break;
                }
              }
              // Fallback: try other possible keys
              if (!imageData && !imageUrl) {
                const candidate = img.url || img.data || img.base64 || img.b64 || img.content || img.value || JSON.stringify(img);
                if (typeof candidate === "string" && (candidate.startsWith("data:") || candidate.startsWith("http") || candidate.length > 100)) {
                  imageData = candidate;
                  break;
                }
              }
            }
          }
        }

        // Format 4: Check for image on message directly
        if (!imageData && !imageUrl) {
          if (message.image?.startsWith("data:")) imageData = message.image;
          else if (message.image?.startsWith("http")) imageUrl = message.image;
        }
      }

      if (imageData) {
        console.log(`Image data received (base64). Saving...`);
        const base64Content = imageData.split(",")[1] || imageData;
        const buffer = Buffer.from(base64Content, "base64");
        const outputDir = path.resolve(__dirname, "..", "public", "images", "plants");
        fs.mkdirSync(outputDir, { recursive: true });
        const outputPath = path.join(outputDir, `${slug}.jpg`);
        fs.writeFileSync(outputPath, buffer);
        const stats = fs.statSync(outputPath);
        console.log(`Image saved to: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
        return;
      }

      if (imageUrl) {
        console.log(`Image URL received. Downloading...`);
        downloadImage(imageUrl, slug);
        return;
      }

      // If we got here, we couldn't find the image. Dump the response structure for debugging.
      console.error("Error: Could not extract image from response.");
      console.error("Response keys:", Object.keys(response));
      if (choices.length > 0) {
        const msg = choices[0].message || {};
        console.error("Message keys:", Object.keys(msg));
        console.error("Content type:", typeof msg.content);
        if (typeof msg.content === "string") {
          console.error("Content starts with:", msg.content.substring(0, 100));
        } else if (Array.isArray(msg.content)) {
          console.error("Content array length:", msg.content.length);
          msg.content.forEach((part, i) => {
            console.error(`  Part ${i}: type=${part.type}, keys=${Object.keys(part).join(", ")}`);
          });
        }
      }
      console.error("Full response:", JSON.stringify(response, null, 2).substring(0, 1000));
      process.exit(1);
    } catch (err) {
      console.error("Error parsing API response:", err.message);
      console.error("Raw response (first 500 chars):", data.substring(0, 500));
      process.exit(1);
    }
  });

  res.on("error", (err) => {
    console.error("Response stream error:", err.message);
    process.exit(1);
  });
});

req.on("timeout", () => {
  console.error(`\nError: Request timed out after ${TIMEOUT_MS / 1000}s.`);
  req.destroy();
  process.exit(1);
});

req.on("error", (err) => {
  console.error("Error making API request:", err.message);
  process.exit(1);
});

req.write(requestBody);
req.end();

function downloadImage(url, slug) {
  const outputDir = path.resolve(__dirname, "..", "public", "images", "plants");
  const outputPath = path.join(outputDir, `${slug}.jpg`);

  https
    .get(url, { timeout: TIMEOUT_MS }, (imageRes) => {
      if (imageRes.statusCode >= 300 && imageRes.statusCode < 400 && imageRes.headers.location) {
        console.log(`Redirecting download to: ${imageRes.headers.location}`);
        downloadImage(imageRes.headers.location, slug);
        return;
      }

      if (imageRes.statusCode !== 200) {
        let errData = "";
        imageRes.on("data", (chunk) => { errData += chunk; });
        imageRes.on("end", () => {
          console.error(`Error downloading image: HTTP ${imageRes.statusCode}`);
          if (errData) console.error("Response:", errData.substring(0, 300));
          process.exit(1);
        });
        return;
      }

      const fileStream = fs.createWriteStream(outputPath);
      imageRes.pipe(fileStream);
      fileStream.on("finish", () => {
        fileStream.close();
        const stats = fs.statSync(outputPath);
        console.log(`Image saved to: ${outputPath} (${(stats.size / 1024).toFixed(1)} KB)`);
      });
      fileStream.on("error", (err) => {
        console.error("Error writing image file:", err.message);
        process.exit(1);
      });
    })
    .on("timeout", () => {
      console.error("Error: Image download timed out.");
      process.exit(1);
    })
    .on("error", (err) => {
      console.error("Error downloading image:", err.message);
      process.exit(1);
    });
}