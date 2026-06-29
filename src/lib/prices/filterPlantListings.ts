import { NormalisedListing, PriceTrackingConfig } from "./types";

export interface FilterResult {
  accepted: NormalisedListing[];
  rejected: { listing: NormalisedListing; reason: string }[];
}

// Terms that are never part of a legitimate plant listing regardless of plant species.
// These catch collectibles, military gear, media, toys etc. that share a plant's name.
const GLOBAL_EXCLUDE_TERMS = [
  "challenge coin",
  "action figure",
  "1/6 scale",
  "1:6 scale",
  "blu-ray",
  "blu ray",
  " dvd ",
  "dvd ",
  "soundtrack",
  "militaria",
  "military patch",
  "embroidered patch",
  "tactical vest",
  "special forces",
  "navy seal",
  "army ranger",
  "video game",
  "pc game",
  "board game",
  "trading card",
  "jigsaw",
  "funko pop",
  "lego ",
  "minifig",
  "t-shirt",
  "hoodie",
  "sweatshirt",
  "coffee mug",
  "sticker pack",
];

/**
 * Filter normalised listings based on a species' priceTracking rules.
 *
 * Rules applied:
 * 1. Title must not contain any GLOBAL_EXCLUDE_TERMS (non-plant collectibles/media)
 * 2. Seller feedback: reject if feedbackScore < 50 AND positivePercentage < 90 (both must fail)
 * 3. Title must contain ALL requiredTerms
 * 4. Title must contain at least ONE acceptedTerms
 * 5. Title must NOT contain any per-plant excludeTerms
 * 6. Currency must be GBP or USD
 * 7. totalPrice must be > 0 and numeric
 * 8. totalPrice must be >= £5
 */
export function filterPlantListings(
  listings: NormalisedListing[],
  config: PriceTrackingConfig
): FilterResult {
  const accepted: NormalisedListing[] = [];
  const rejected: { listing: NormalisedListing; reason: string }[] = [];

  for (const listing of listings) {
    const title = listing.title;

    // ─── 1. Global non-plant block list ─────────────────────────────────
    const globalExcluded = GLOBAL_EXCLUDE_TERMS.find((term) =>
      title.includes(term.toLowerCase())
    );
    if (globalExcluded) {
      rejected.push({
        listing,
        reason: `Global block: contains "${globalExcluded}"`,
      });
      continue;
    }

    // ─── 2. Seller feedback quality ─────────────────────────────────────
    // Both conditions must fail simultaneously (loose filter — avoids blocking
    // legitimate niche sellers who are new to eBay).
    const score = listing.sellerFeedbackScore;
    const pct = listing.sellerPositivePercentage;
    if (
      typeof score === "number" && score < 50 &&
      typeof pct === "number" && !isNaN(pct) && pct < 90
    ) {
      rejected.push({
        listing,
        reason: `Seller feedback too low (score: ${score}, positive: ${pct}%)`,
      });
      continue;
    }

    // ─── 3. Required terms (now step 3 in the updated pipeline) ─────────
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

    // ─── 3. Accepted terms (at least one) ────────────────────────────────
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

    // ─── 4. Exclude terms ────────────────────────────────────────────────
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

    // ─── 5. Currency check — accept GBP or USD (convert USD to GBP) ────
    const currency = listing.currency;
    if (currency !== "GBP" && currency !== "USD") {
      rejected.push({
        listing,
        reason: `Currency is ${currency}, not GBP or USD`,
      });
      continue;
    }

    // ─── 6. Price validity ──────────────────────────────────────────────
    if (listing.totalPrice <= 0 || isNaN(listing.totalPrice)) {
      rejected.push({
        listing,
        reason: `Total price is ${listing.totalPrice}, not valid`,
      });
      continue;
    }

    // ─── 7. Minimum price ────────────────────────────────────────────────
    if (listing.totalPrice < 5) {
      rejected.push({
        listing,
        reason: `Total price £${listing.totalPrice.toFixed(2)} is below £5 minimum`,
      });
      continue;
    }

    // ─── 8. Passed all checks ────────────────────────────────────────────
    accepted.push(listing);
  }

  return { accepted, rejected };
}