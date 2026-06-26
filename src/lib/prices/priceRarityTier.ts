const PRICE_TIERS = [
  { maxGBP: 40,       tier: "£",    label: "Common" },
  { maxGBP: 100,      tier: "££",   label: "Uncommon" },
  { maxGBP: 300,      tier: "£££",  label: "Rare" },
  { maxGBP: Infinity, tier: "££££", label: "Collector" },
] as const;

const STATIC_TIER_LABELS: Record<string, string> = {
  "£":    "Common",
  "££":   "Uncommon",
  "£££":  "Rare",
  "££££": "Collector",
};

export const TIER_RANGES: Record<string, { min: number; max: number; label: string }> = {
  "£":    { min: 5,   max: 25,   label: "£5 – £25" },
  "££":   { min: 25,  max: 80,   label: "£25 – £80" },
  "£££":  { min: 80,  max: 300,  label: "£80 – £300" },
  "££££": { min: 300, max: 1500, label: "£300+" },
};

export function getPriceRarityTier(priceGBP: number): { tier: string; label: string } {
  if (priceGBP <= 0) return { tier: "£", label: "Common" };
  for (const entry of PRICE_TIERS) {
    if (priceGBP < entry.maxGBP) return { tier: entry.tier, label: entry.label };
  }
  return { tier: "££££", label: "Collector" };
}

export function getStaticTierLabel(priceGuideTier: string): string {
  return STATIC_TIER_LABELS[priceGuideTier] ?? "Unknown";
}
