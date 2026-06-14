import { NormalisedListing, ClassifiedListing, ListingType } from "./types";

/**
 * Classify a normalised listing into a listing type and detect lot size.
 *
 * Listing types:
 * - whole_plant: potted/established plant (preferred for chart)
 * - rooted_cutting: rooted cutting (preferred for chart)
 * - unrooted_cutting: cutting without roots
 * - node: just a node / wet stick
 * - tc_plantlet: tissue culture / plantlet
 * - seedling: seedling
 * - established_plant: potted plant
 * - mature_plant: mature / XL / large
 * - unknown: can't determine
 *
 * Lot size detection:
 * - "x10", "10x", "pack of 10" → lotSize = 10
 * - Divides totalPrice by lotSize to create unitPrice
 */
export function classifyListing(
  listing: NormalisedListing
): ClassifiedListing {
  const title = listing.title;

  // ─── Lot Size Detection ────────────────────────────────────────────────
  let lotSize = 1;

  // Match patterns like "x10", "10x", "pack of 10", "bundle of 10"
  const lotPatterns = [
    /(\d+)\s*x\s*/i,
    /x\s*(\d+)/i,
    /pack\s+of\s+(\d+)/i,
    /bundle\s+of\s+(\d+)/i,
    /lot\s+of\s+(\d+)/i,
    /set\s+of\s+(\d+)/i,
  ];

  for (const pattern of lotPatterns) {
    const match = title.match(pattern);
    if (match) {
      lotSize = parseInt(match[1], 10);
      if (lotSize > 1) break;
    }
  }

  // ─── Listing Type Detection ────────────────────────────────────────────
  let listingType: ListingType = "unknown";

  // Whole plant / established (potted)
  if (
    /\bpot\b/.test(title) ||
    /\bpotted\b/.test(title) ||
    /\bcm\s*pot\b/.test(title) ||
    /\bplant\b/.test(title) ||
    /\bestablished\b/.test(title)
  ) {
    listingType = "whole_plant";
  }

  // Rooted cutting
  if (/\brooted\b/.test(title) && /\bcutting\b/.test(title)) {
    listingType = "rooted_cutting";
  }

  // Unrooted cutting
  if (/\bunrooted\b/.test(title) || (/\bcutting\b/.test(title) && !/\brooted\b/.test(title))) {
    listingType = "unrooted_cutting";
  }

  // Node / wet stick
  if (/\bnode\b/.test(title) || /\bwet\s*stick\b/.test(title)) {
    listingType = "node";
  }

  // TC / Tissue Culture
  if (
    /\btc\b/.test(title) ||
    /\btissue\s*culture\b/.test(title) ||
    /\bplantlet\b/.test(title) ||
    /\bplantlets\b/.test(title)
  ) {
    listingType = "tc_plantlet";
  }

  // Seedling
  if (/\bseedling\b/.test(title)) {
    listingType = "seedling";
  }

  // Mature / Large / XL
  if (
    /\bmature\b/.test(title) ||
    /\blarge\b/.test(title) ||
    /\bxl\b/.test(title)
  ) {
    listingType = "mature_plant";
  }

  // ─── Calculate Unit Price ──────────────────────────────────────────────
  const unitPrice = lotSize > 1
    ? listing.totalPrice / lotSize
    : listing.totalPrice;

  return {
    ...listing,
    listingType,
    lotSize,
    unitPrice,
  };
}