// ─── SoldComps Raw API Response ───────────────────────────────────────────
// @TODO: Replace these types with the actual SoldComps API response schema.
// Once you have the real endpoint docs, paste the response shape here.

export interface SoldCompsRawItem {
  title?: string;
  soldPrice?: string | number;
  shippingPrice?: string | number;
  totalPrice?: string | number;
  currency?: string;
  soldDate?: string;
  seller?: string;
  condition?: string;
  url?: string;
  // Add any additional fields the API returns
}

export interface SoldCompsResponse {
  items?: SoldCompsRawItem[];
  data?: { items?: SoldCompsRawItem[] };
  // Add the actual top-level response shape here
}

// ─── Normalised Listing ────────────────────────────────────────────────────

export interface NormalisedListing {
  title: string;
  originalTitle: string;
  soldPrice: number;
  shippingPrice: number;
  totalPrice: number;
  unitPrice: number;
  currency: string;
  soldDate: string | null;
  seller: string;
  condition: string;
  url: string;
}

// ─── Listing Classification ────────────────────────────────────────────────

export type ListingType =
  | "seedling"
  | "cutting"
  | "rooted_cutting"
  | "tc_plantlet"
  | "plug"
  | "established_plant"
  | "mature_plant"
  | "unknown";

export interface ClassifiedListing extends NormalisedListing {
  listingType: ListingType;
  lotSize: number;
}

// ─── Filtering ─────────────────────────────────────────────────────────────

export interface FilterResult {
  accepted: ClassifiedListing[];
  rejected: { listing: NormalisedListing; reason: string }[];
}

// ─── Price Tracking Config (stored in species JSON) ────────────────────────

export interface PriceTrackingConfig {
  enabled: boolean;
  source: string;
  marketplace: string;
  query: string;
  requiredTerms: string[];
  acceptedTerms: string[];
  excludeTerms: string[];
  marketCurrency: string;
}

// ─── Price Statistics ──────────────────────────────────────────────────────

export type ConfidenceGrade = "A" | "B" | "C" | "D";

export interface PriceStats {
  sampleSize: number;
  min: number;
  max: number;
  median: number;
  mean: number;
  p25: number;
  p75: number;
  iqr: number;
  trimmedMean: number;
  confidenceScore: ConfidenceGrade;
  rejectedCount: number;
  rejectionReasons: Record<string, number>;
  outlierCount: number;
}

// ─── Snapshot (stored in DB or JSON) ───────────────────────────────────────

export interface PriceSnapshot {
  id?: string;
  plantSlug: string;
  source: string;
  marketplace: string;
  query: string;
  checkedAt: string; // ISO date
  currency: string;
  rawResultCount: number;
  acceptedCount: number;
  rejectedCount: number;
  outlierCount: number;
  confidenceScore: ConfidenceGrade;
  minPrice: number;
  p25Price: number;
  medianPrice: number;
  meanPrice: number;
  trimmedMeanPrice: number;
  p75Price: number;
  maxPrice: number;
  notes: string;
}

export interface PriceListing {
  id?: string;
  snapshotId?: string;
  plantSlug: string;
  title: string;
  normalizedTitle: string;
  listingType: ListingType;
  lotSize: number;
  soldPrice: number;
  shippingPrice: number;
  totalPrice: number;
  unitPrice: number;
  currency: string;
  soldDate: string | null;
  seller: string;
  condition: string;
  url: string;
  accepted: boolean;
  rejectionReason: string | null;
  isOutlier: boolean;
}

// ─── Public API Response ───────────────────────────────────────────────────

export interface PriceHistoryPoint {
  date: string;
  median: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  sampleSize: number;
  confidenceScore: ConfidenceGrade;
}

export interface PriceHistoryResponse {
  slug: string;
  history: PriceHistoryPoint[];
}

// ─── Admin Update Response ─────────────────────────────────────────────────

export interface AdminUpdateResponse {
  success: boolean;
  snapshot: PriceSnapshot | null;
  stats: PriceStats | null;
  acceptedListings: ClassifiedListing[];
  rejectedListings: { listing: NormalisedListing; reason: string }[];
  warnings: string[];
}