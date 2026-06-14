import { NormalisedListing, PriceTrackingConfig } from "./types";

export interface FilterResult {
  accepted: NormalisedListing[];
  rejected: { listing: NormalisedListing; reason: string }[];
}

/**
 * Filter normalised listings based on a species' priceTracking rules.
 *
 * Rules applied:
 * 1. Title must contain ALL requiredTerms
 * 2. Title must contain at least ONE acceptedTerms
 * 3. Title must NOT contain any excludeTerms
 * 4. Currency must be GBP
 * 5. totalPrice must be > 0 and numeric
 * 6. totalPrice must be >= £5
 * 7. Title must not be obviously not the target species
 */
export function filterPlantListings(
  listings: NormalisedListing[],
  config: PriceTrackingConfig
): FilterResult {
  const accepted: NormalisedListing[] = [];
  const rejected: { listing: NormalisedListing; reason: string }[] = [];

  for (const listing of listings) {
    const title = listing.title;

    // ─── 1. Required terms ──────────────────────────────────────────────
    const hasAllRequired = config.requiredTerms.every((term) =>
      title.includes(term.toLowerCase())
    );
    if (!hasAllRequired) {
      rejected.push({
        listing,
        reason: `Missing required term: "${config.requiredTerms.find(
          (t) => !title.includes(t.toLowerCase())
        )}"`,
      });
      continue;
    }

    // ─── 2. Accepted terms (at least one) ────────────────────────────────
    const hasAccepted = config.acceptedTerms.some((term) =>
      title.includes(term.toLowerCase())
    );
    if (!hasAccepted) {
      rejected.push({
        listing,
        reason: `No accepted term found. Expected one of: ${config.acceptedTerms.join(", ")}`,
      });
      continue;
    }

    // ─── 3. Exclude terms ────────────────────────────────────────────────
    const hasExcluded = config.excludeTerms.some((term) =>
      title.includes(term.toLowerCase())
    );
    if (hasExcluded) {
      rejected.push({
        listing,
        reason: `Contains excluded term: "${config.excludeTerms.find(
          (t) => title.includes(t.toLowerCase())
        )}"`,
      });
      continue;
    }

    // ─── 4. Currency check ──────────────────────────────────────────────
    if (listing.currency !== "GBP") {
      rejected.push({
        listing,
        reason: `Currency is ${listing.currency}, not GBP`,
      });
      continue;
    }

    // ─── 5. Price validity ──────────────────────────────────────────────
    if (listing.totalPrice <= 0 || isNaN(listing.totalPrice)) {
      rejected.push({
        listing,
        reason: `Total price is ${listing.totalPrice}, not valid`,
      });
      continue;
    }

    // ─── 6. Minimum price ────────────────────────────────────────────────
    if (listing.totalPrice < 5) {
      rejected.push({
        listing,
        reason: `Total price £${listing.totalPrice.toFixed(2)} is below £5 minimum`,
      });
      continue;
    }

    // ─── 7. Passed all checks ────────────────────────────────────────────
    accepted.push(listing);
  }

  return { accepted, rejected };
}