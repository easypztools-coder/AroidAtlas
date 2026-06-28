export interface PriceIndexRow {
  slug: string;
  genus: string;
  name: string;
  scientificName: string;
  commonName: string;
  botanicalType: string;
  rarityStatus: string;
  priceGuideTier: string;
  collectorPopularity: number;
  currentMedianPriceGBP: number | null;
  estimatedSource: string | null;
  threeMonthChangePercent: number | null;
  marketStatus: string | null;
  dbMedianPrice: number | null;
  listingCount: number;
  inStockCount: number;
  retailerCount: number;
  hasRetailData: boolean;
}
