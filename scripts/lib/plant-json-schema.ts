/**
 * Shared PlantData JSON schema description used by both generate-plant-pages.ts
 * (image-grounded) and generate-simplified-plants.ts (name-only inference).
 * Kept as a single source of truth so the two generation pipelines never drift
 * into producing inconsistent JSON shapes.
 */
export const PLANT_JSON_SCHEMA = `
Return ONLY a raw JSON object matching this TypeScript type:

interface QuickFacts {
  growthHabit: string;
  matureSize: string;
  light: string;
  humidity: string;
  temperature: string;
  difficulty: string;
  growthSpeed: string;
}

interface Morphology {
  leafShape: string;
  leafLength: string;
  leafWidth: string;
  petioleColor: string;
  venation: string;
  texture: string;
  variegation: string;
  growthHabit: string;
}

interface PlantData {
  name: string; // The full display name, e.g. "Philodendron x joepii 'Aurea Variegata'" or "Alocasia reginula 'Black Velvet' Pink Albo Variegata"
  slug: string; // URL-friendly slug. Strip genus name, e.g. "joepii-aurea-variegata" or "reginula-black-velvet-pink-albo-variegata" or "cuprea-pink-variegata"
  scientificName: string; // Scientific name from SCIENTIFIC NAME section of the plate
  commonName: string; // Common name (e.g. "Ace of Spades Variegata Anthurium", "Whipple Way Philodendron")
  statusTag: string; // e.g. "Rare Variegata Cultivar", "Extremely Rare Cultivar"
  botanicalType: "species" | "hybrid" | "mutation" | "variegated" | "cultivar"; // Botanical classification: "species" = wild species, "hybrid" = cross between species, "mutation" = non-variegated structural mutation (e.g. Venom), "variegated" = variegated sport mutation, "cultivar" = non-variegated stable cultivar selection.
  family: "Araceae";
  genus: string; // "Alocasia", "Anthurium", "Monstera", or "Philodendron"
  species: string; // Species or cultivar name part (e.g. "Ace of Spades", "Whipple Way")
  origin: string; // Origin text from the plate
  collectorPopularity: number; // Integer 1-5 representing how highly sought after it is (typically 4 or 5 for these rare cultivars)
  rarityStatus: string; // "Rare", "Very Rare", or "Ultra Rare"
  availability: string; // "Low" or "Very Low"
  priceGuideTier: string; // "£££" or "££££"
  aboutText: string; // A descriptive 3-5 sentence paragraph summarizing the history, mutation details, and visual features of the plant based on the plate's texts (specifically native origin, morphology summary, and habitat info).
  quickFacts: QuickFacts; // Fill this based on the plate's HABITAT/QUICK FACTS info
  morphology: Morphology; // Fill this based on the plate's MORPHOLOGY SUMMARY info
  marketMetrics: {
    currentMedianPriceGBP: null;
    threeMonthChangePercent: null;
    marketStatus: null;
  };
  priceTracking: {
    enabled: true;
    source: "soldcomps";
    marketplace: "ebay.co.uk";
    query: string; // Simple keyword query to search eBay, e.g. "Philodendron Whipple Way"
    requiredTerms: string[]; // Keep empty [] unless there is a very specific word needed
    acceptedTerms: string[]; // List of 4-6 alternative names or spelling variants to include
    excludeTerms: string[]; // List of excluded terms, e.g. ["seeds", "seed", "bulb", "rhizome", "corm", "poster", "print", "book", "magazine", "care guide", "artificial", "fake", "plastic", "silk", "soil", "perlite", "fertiliser", "fertilizer", "moss pole", "pot only", "label", "tag", "cutting board"]
    marketCurrency: "GBP";
  };
  recommendedPlants: []; // Leave empty array []
}

Please ensure:
- Values are strictly strings, numbers, booleans, or null as specified.
- The output contains ONLY valid JSON. Do not wrap it in markdown code fences (\`\`\`json ... \`\`\`).
- If information is missing, infer realistic values matching the plant's known characteristics.
`;
