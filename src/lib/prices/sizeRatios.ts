/**
 * Price ratios relative to a 7cm whole plant (the standard collector unit = 1.0).
 *
 * Used to normalise eBay sold listings of different sizes/forms to a single
 * comparable baseline, and to derive sub-prices in the price calculator.
 *
 * These are reasonable industry starting points and can be overridden
 * per-plant via priceTracking.sizeRatioOverrides in the plant JSON.
 */
export const SIZE_RATIOS: Record<string, number> = {
  tc_plantlet:      0.12,
  node:             0.18,
  unrooted_cutting: 0.20,
  seedling:         0.22,
  rooted_cutting:   0.32,
  whole_plant_7:    1.00, // baseline — 7cm pot
  whole_plant_12:   2.20,
  whole_plant_17:   3.80,
  whole_plant_21:   6.00,
  mature_plant:     6.00,
  unknown:          1.00, // treat unknown as 7cm baseline
};

/**
 * Map pot size (cm) to the appropriate whole_plant ratio key.
 */
export function potSizeToBracket(potSizeCm: number): string {
  if (potSizeCm <= 9)  return "whole_plant_7";
  if (potSizeCm <= 14) return "whole_plant_12";
  if (potSizeCm <= 19) return "whole_plant_17";
  return "whole_plant_21";
}

/**
 * Litre-to-cm pot size approximations (common UK/EU nursery sizing).
 */
export const LITRE_TO_CM: Array<{ maxLitres: number; cm: number }> = [
  { maxLitres: 0.6, cm: 7  },
  { maxLitres: 1.0, cm: 9  },
  { maxLitres: 1.5, cm: 12 },
  { maxLitres: 2.5, cm: 14 },
  { maxLitres: 4.0, cm: 17 },
  { maxLitres: 7.0, cm: 21 },
  { maxLitres: Infinity, cm: 25 },
];

/**
 * Variegation level multipliers — only applicable when priceTracking.varianceEnabled = true.
 * Applied on top of the size/form ratio in the price calculator.
 */
export const VARIEGATION_MULTIPLIERS: Record<string, number> = {
  light:       1.3,
  medium:      2.0,
  heavy:       3.5,
  "full-moon": 6.0,
};

/**
 * Human-readable labels for each listing type (used in UI).
 */
export const LISTING_TYPE_LABELS: Record<string, string> = {
  tc_plantlet:      "TC / Plantlet",
  node:             "Node / Wet stick",
  unrooted_cutting: "Unrooted cutting",
  seedling:         "Seedling",
  rooted_cutting:   "Rooted cutting",
  whole_plant:      "Whole plant (7cm)",
  mature_plant:     "Mature plant",
  unknown:          "Plant",
};

/**
 * Return the price ratio for a listing relative to a 7cm whole plant.
 * listingType must be one of the ListingType values; potSizeCm is used
 * to pick the correct whole_plant_* bracket when the type is "whole_plant".
 */
export function getListingRatio(listingType: string, potSizeCm?: number): number {
  if (listingType === "whole_plant" || listingType === "unknown") {
    const bracket = potSizeCm ? potSizeToBracket(potSizeCm) : "whole_plant_7";
    return SIZE_RATIOS[bracket] ?? 1.0;
  }
  return SIZE_RATIOS[listingType] ?? 1.0;
}

/**
 * Retail markup factor: retailers typically price ~35% above the secondhand
 * market value. Used when blending retail asking prices into the AA Price.
 */
export const RETAIL_MARKUP_FACTOR = 1.35;

/**
 * Convert a confidence grade to a numeric weight for blending.
 * A = 4, B = 3, C = 2, D = 1
 */
export function confidenceToWeight(grade: string): number {
  switch (grade) {
    case "A": return 4;
    case "B": return 3;
    case "C": return 2;
    default:  return 1;
  }
}
