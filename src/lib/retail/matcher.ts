export interface MatchResult {
  confidence: number;
  reason: string;
  itemType:
    | "tc_plantlet"
    | "seedling"
    | "cutting"
    | "rooted_cutting"
    | "established_plant"
    | "mature_plant"
    | "unknown";
}

// General terms that suggest accessories, art, or artificial items
const GENERAL_EXCLUSIONS = [
  "pot only",
  "plastic pot",
  "clay pot",
  "terracotta pot",
  "ceramic pot",
  "cover pot",
  "saucer",
  "moss pole",
  "moss-pole",
  "moss pole only",
  "trellis",
  "plant support",
  "hanger",
  "macrame",
  "soil",
  "perlite",
  "pumice",
  "vermiculite",
  "leca",
  "sphagnum",
  "moss",
  "fertiliser",
  "fertilizer",
  "feed",
  "plant food",
  "pest control",
  "insecticide",
  "neem oil",
  "spray",
  "art print",
  "poster",
  "card",
  "sticker",
  "mug",
  "t-shirt",
  "bag",
  "book",
  "magazine",
  "calendar",
  "care guide",
  "label",
  "tag",
  "artificial",
  "fake",
  "faux",
  "plastic plant",
  "silk plant",
  "synthetic",
  "decor",
  "decoration",
];

// Mixed collection triggers
const MIXED_EXCLUSIONS = [
  "mixed box",
  "mystery box",
  "mystery pack",
  "mixed collection",
  "assorted plants",
  "assorted house",
  "houseplant mix",
  "mix pack",
  "mixed aroids",
  "collection of 3",
  "collection of 4",
  "collection of 5",
  "collection of 6",
  "bundle of 3",
  "bundle of 4",
  "bundle of 5",
];

/**
 * Classify product listing into one of the designated retail categories.
 */
export function classifyProduct(title: string): MatchResult["itemType"] {
  const t = title.toLowerCase();

  // Mature plants
  if (
    t.includes("mature") ||
    t.includes("specimen") ||
    t.includes("xl") ||
    t.includes("extra large") ||
    t.includes("large plant") ||
    t.includes("big plant")
  ) {
    return "mature_plant";
  }

  // Tissue culture
  if (
    t.includes("tc") ||
    t.includes("tissue culture") ||
    t.includes("plantlet") ||
    t.includes("flask") ||
    t.includes("vitro")
  ) {
    return "tc_plantlet";
  }

  // Seedling
  if (t.includes("seedling") || t.includes("baby plant")) {
    return "seedling";
  }

  // Rooted cutting
  if (t.includes("rooted cutting") || t.includes("rooted node") || t.includes("rooted stick")) {
    return "rooted_cutting";
  }

  // Cutting (unrooted or general)
  if (
    t.includes("cutting") ||
    t.includes("unrooted") ||
    t.includes("node") ||
    t.includes("wet stick") ||
    t.includes("wetstick") ||
    t.includes("leaf cutting")
  ) {
    return "cutting";
  }

  // Established plant
  if (
    t.includes("established") ||
    t.includes("potted") ||
    t.includes("pot") ||
    t.includes("whole plant") ||
    t.includes("rooted plant") ||
    t.includes("active growth")
  ) {
    return "established_plant";
  }

  return "unknown";
}

/**
 * Normalises a string for term matching (lowercases, removes punctuation and extra spaces).
 */
export function normaliseString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[‘'’"““”]/g, "") // remove quotes
    .replace(/[^\w\s-]/g, " ") // replace punctuation with spaces
    .replace(/\s+/g, " ") // collapse multiple spaces
    .trim();
}

/**
 * Computes match confidence between 0.0 and 1.0 for a product title against a plant profile.
 *
 * @param productTitle - The title of the retail product.
 * @param plantData - The configuration of the plant species (from content/plants).
 * @param allPlantSlugsAndNames - List of other plant slugs and names to prevent cross-matching.
 */
export function matchProduct(
  productTitle: string,
  plantData: any,
  allPlantSlugsAndNames: { slug: string; genus: string; species: string; cultivar?: string }[]
): MatchResult {
  const normTitle = normaliseString(productTitle);
  const itemType = classifyProduct(productTitle);

  // ─── 1. Currency & Price Validation ───────────────────────────────────────
  // Note: we assume caller has verified prices are valid numbers > 0 and currency is GBP.

  // ─── 2. General Exclusions Check ──────────────────────────────────────────
  for (const exclusion of GENERAL_EXCLUSIONS) {
    if (normTitle.includes(exclusion)) {
      return { confidence: 0, reason: `Excluded category: contains "${exclusion}"`, itemType };
    }
  }

  // Mixed collections check
  for (const mix of MIXED_EXCLUSIONS) {
    if (normTitle.includes(mix)) {
      return { confidence: 0, reason: `Excluded category: contains mixed term "${mix}"`, itemType };
    }
  }

  // Plant seeds exclusion if the plant record excludes seeds
  const plantExcludesSeeds =
    plantData.priceTracking?.excludeTerms?.some(
      (term: string) => term.toLowerCase() === "seed" || term.toLowerCase() === "seeds"
    ) || true; // Default to true if not specified

  if (plantExcludesSeeds && (normTitle.includes("seed") || normTitle.includes("seeds"))) {
    if (!normTitle.includes("seedling")) {
      return { confidence: 0, reason: "Seeds are excluded for this plant record", itemType };
    }
  }

  // ─── 3. Plant Specific Exclusions ─────────────────────────────────────────
  const plantExcludes = plantData.priceTracking?.excludeTerms || [];
  for (const exclude of plantExcludes) {
    const normExclude = normaliseString(exclude);
    if (normExclude && normTitle.includes(normExclude)) {
      return { confidence: 0, reason: `Matches plant-specific exclusion: "${exclude}"`, itemType };
    }
  }

  // ─── 4. Genus Matching & Safety Checks ────────────────────────────────────
  const plantGenus = plantData.genus.toLowerCase();
  const plantSpecies = plantData.species.toLowerCase();
  const plantCultivar = plantData.name
    .match(/'([^']+)'/)?.[1]
    ?.toLowerCase() || "";

  // Verify it belongs to the target Genus
  const hasGenus =
    normTitle.includes(plantGenus) ||
    // check abbreviation, e.g. "p. caramel marble" for Philodendron
    (plantGenus === "philodendron" && normTitle.match(/\bp\b/i)) ||
    (plantGenus === "monstera" && normTitle.match(/\bm\b/i)) ||
    (plantGenus === "alocasia" && normTitle.match(/\ba\b/i)) ||
    (plantGenus === "anthurium" && normTitle.match(/\ba\b/i)) ||
    (plantGenus === "rhaphidophora" && normTitle.match(/\br\b/i)) ||
    (plantGenus === "scindapsus" && normTitle.match(/\bs\b/i)) ||
    (plantGenus === "amydrium" && normTitle.match(/\ba\b/i)) ||
    (plantGenus === "epipremnum" && normTitle.match(/\be\b/i)) ||
    (plantGenus === "cercestis" && normTitle.match(/\bc\b/i)) ||
    (plantGenus === "pothos" && normTitle.match(/\bp\b/i));

  if (!hasGenus) {
    // If the title contains a DIFFERENT known genus, reject immediately
    const otherGenera = ["philodendron", "monstera", "alocasia", "anthurium", "rhaphidophora", "scindapsus", "amydrium", "epipremnum", "cercestis", "pothos"].filter(
      (g) => g !== plantGenus
    );
    for (const g of otherGenera) {
      if (normTitle.includes(g)) {
        return { confidence: 0, reason: `Genus mismatch: contains "${g}" instead of "${plantGenus}"`, itemType };
      }
    }
  }

  // ─── 5. Genus Mismatch Safety (Different species/cultivars) ───────────────
  // Loop through all OTHER plants in our database and check if this product title
  // matches their species/cultivar terms. If it matches a DIFFERENT plant, reject!
  for (const other of allPlantSlugsAndNames) {
    if (other.slug === plantData.slug) continue;

    // Check species mismatch
    if (other.species !== "hybrid" && other.species !== "sp" && other.species !== "sp.") {
      const otherSpeciesNorm = normaliseString(other.species);
      if (
        otherSpeciesNorm &&
        normTitle.includes(otherSpeciesNorm) &&
        !normTitle.includes(normaliseString(plantSpecies))
      ) {
        return { confidence: 0, reason: `Species mismatch: contains "${other.species}" (matches other plant: ${other.slug})`, itemType };
      }
    }

    // Check cultivar mismatch
    if (other.cultivar) {
      const otherCultivarNorm = normaliseString(other.cultivar);
      if (
        otherCultivarNorm &&
        normTitle.includes(otherCultivarNorm) &&
        (!plantCultivar || !normTitle.includes(plantCultivar))
      ) {
        return { confidence: 0, reason: `Cultivar mismatch: contains "${other.cultivar}" (matches other plant: ${other.slug})`, itemType };
      }
    }
  }

  // ─── 6. Required Terms Check ──────────────────────────────────────────────
  const requiredTerms = plantData.priceTracking?.requiredTerms || [];
  for (const term of requiredTerms) {
    const normTerm = normaliseString(term);
    if (normTerm && !normTitle.includes(normTerm)) {
      return { confidence: 0, reason: `Missing required term: "${term}"`, itemType };
    }
  }

  // ─── 7. Confidence Scoring ────────────────────────────────────────────────
  // Check exact matches of accepted terms/aliases first
  const acceptedTerms = plantData.priceTracking?.acceptedTerms || [];
  for (const term of acceptedTerms) {
    const normTerm = normaliseString(term);
    if (normTerm && normTitle === normTerm) {
      return { confidence: 1.0, reason: `Exact match with accepted alias: "${term}"`, itemType };
    }
    if (normTerm && normTitle.includes(normTerm)) {
      // If it contains the term as a full word boundary
      const regex = new RegExp(`\\b${normTerm}\\b`, "i");
      if (regex.test(normTitle)) {
        return { confidence: 0.90, reason: `Substring match with accepted alias: "${term}"`, itemType };
      }
    }
  }

  // Compute scoring based on tokens
  let score = 0.0;

  // Genus presence
  if (normTitle.includes(plantGenus)) {
    score += 0.25;
  } else if (
    (plantGenus === "philodendron" && normTitle.includes("p. ")) ||
    (plantGenus === "monstera" && normTitle.includes("m. ")) ||
    (plantGenus === "alocasia" && normTitle.includes("a. ")) ||
    (plantGenus === "anthurium" && normTitle.includes("a. ")) ||
    (plantGenus === "amydrium" && normTitle.includes("a. ")) ||
    (plantGenus === "epipremnum" && normTitle.includes("e. ")) ||
    (plantGenus === "cercestis" && normTitle.includes("c. ")) ||
    (plantGenus === "pothos" && normTitle.includes("p. "))
  ) {
    score += 0.15;
  }

  // Species match
  if (plantSpecies !== "hybrid" && plantSpecies !== "sp" && plantSpecies !== "sp.") {
    const normSpec = normaliseString(plantSpecies);
    if (normTitle.includes(normSpec)) {
      score += 0.35;
    }
  } else {
    // If it's a hybrid or sp., genus presence + cultivar is required
    score += 0.15; // baseline compensation
  }

  // Cultivar match
  if (plantCultivar) {
    const normCult = normaliseString(plantCultivar);
    if (normTitle.includes(normCult)) {
      score += 0.35;
    }
  }

  // Generic check: if title has no species or cultivar details, it's generic genus-only
  if (score <= 0.25) {
    return { confidence: 0.0, reason: "Generic genus-only listing", itemType };
  }

  // Word overlap ratio modifier
  const plantWords = `${plantGenus} ${plantSpecies === "hybrid" ? "" : plantSpecies} ${plantCultivar}`
    .split(/\s+/)
    .filter(Boolean)
    .map(w => normaliseString(w));

  let matchingWords = 0;
  for (const w of plantWords) {
    if (normTitle.includes(w)) {
      matchingWords++;
    }
  }
  const overlapRatio = matchingWords / plantWords.length;
  score += overlapRatio * 0.05;

  const finalConfidence = Math.min(1.0, Math.max(0.0, score));

  let reason = `Calculated confidence score: ${finalConfidence.toFixed(2)}`;
  if (finalConfidence >= 0.85) {
    reason += " (Automatic accepted match)";
  } else if (finalConfidence >= 0.65) {
    reason += " (Requires manual review)";
  } else {
    reason += " (Confidence too low)";
  }

  return {
    confidence: finalConfidence,
    reason,
    itemType,
  };
}
