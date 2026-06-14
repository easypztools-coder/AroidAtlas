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
