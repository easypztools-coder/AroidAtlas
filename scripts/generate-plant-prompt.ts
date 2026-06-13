/**
 * CLI tool: npm run generate-plant-prompt -- <species-name>
 *
 * Reads the corresponding JSON file from species/<species-name>.json,
 * prints the final image-generation prompt to stdout,
 * and saves a copy to prompts/<species-name>.txt
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import {
  generatePlantImagePrompt,
  SpeciesData,
} from "../lib/plant-image-script";

const speciesName = process.argv[2];

if (!speciesName) {
  console.error("Usage: npm run generate-plant-prompt -- <species-name>");
  console.error(
    "Example: npm run generate-plant-prompt -- example-spiritus-sancti"
  );
  process.exit(1);
}

const jsonPath = resolve(__dirname, "..", "species", `${speciesName}.json`);

let raw: string;
try {
  raw = readFileSync(jsonPath, "utf-8");
} catch {
  console.error(`Error: Could not find species file at ${jsonPath}`);
  console.error(
    "Make sure a corresponding JSON file exists in the species/ directory."
  );
  process.exit(1);
}

let speciesData: SpeciesData;
try {
  speciesData = JSON.parse(raw) as SpeciesData;
} catch {
  console.error("Error: Failed to parse JSON file.");
  process.exit(1);
}

const prompt = generatePlantImagePrompt(speciesData);

// Print to terminal
console.log(prompt);

// Save to prompts/ folder
const promptsDir = resolve(__dirname, "..", "prompts");
mkdirSync(promptsDir, { recursive: true });
const outputPath = resolve(promptsDir, `${speciesName}.txt`);
writeFileSync(outputPath, prompt, "utf-8");
console.log(`\n--- Saved to ${outputPath} ---`);