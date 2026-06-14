/**
 * ─── PRICE MODULE ────────────────────────────────────────────────────────
 *
 * Barrel export for the price system.
 *
 * Usage:
 *   import { fetchSoldCompsRaw } from "@/lib/prices";
 *   import { normaliseListing } from "@/lib/prices";
 *   import { filterPlantListings } from "@/lib/prices";
 *   import { classifyListing } from "@/lib/prices";
 *   import { calculateStats } from "@/lib/prices";
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

export { fetchSoldCompsRaw } from "./soldcomps";
export { normaliseListing } from "./normaliseListing";
export { filterPlantListings } from "./filterPlantListings";
export { classifyListing } from "./classifyPlantListing";
export { calculateStats } from "./calculatePriceStats";
export { saveSnapshot, loadLatestSnapshot, listSnapshots } from "./database";

// Re-export types for convenience
export type {
  SoldCompsRawItem,
  SoldCompsResponse,
  NormalisedListing,
  ClassifiedListing,
  ListingType,
  PriceTrackingConfig,
  PriceStats,
  ConfidenceGrade,
  PriceSnapshot,
  PriceListing,
  PriceHistoryPoint,
  PriceHistoryResponse,
  AdminUpdateResponse,
} from "./types";