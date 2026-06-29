import { SoldCompsRawItem, NormalisedListing } from "./types";

/**
 * Normalise a raw SoldComps listing into a clean, typed format.
 *
 * Handles:
 * - Price strings → numbers ("£23.00" → 23.00)
 * - Shipping strings → numbers ("Free" → 0)
 * - USD → GBP currency conversion (rate fetched live; defaults to 0.79)
 * - TotalPrice calculation (soldPrice + shippingPrice if not provided)
 * - Date parsing
 * - Title normalisation
 */
export function normaliseListing(raw: SoldCompsRawItem, usdToGbpRate = 0.79): NormalisedListing {
  // ─── Currency ──────────────────────────────────────────────────────────
  const rawCurrency = (raw.soldCurrency ?? "GBP").toUpperCase();
  const currencyMultiplier = rawCurrency === "USD" ? usdToGbpRate : 1;
  const currency: string = rawCurrency;

  // ─── Sold Price ──────────────────────────────────────────────────────
  const soldPrice = parsePrice(raw.soldPrice ?? 0) * currencyMultiplier;

  // ─── Shipping Price ───────────────────────────────────────────────────
  const shippingPrice = parseShipping(raw.shippingPrice) * currencyMultiplier;

  // ─── Total Price ───────────────────────────────────────────────────────
  const totalPrice = soldPrice + shippingPrice;

  // ─── Unit Price ────────────────────────────────────────────────────────
  // Default to totalPrice — lot size division happens in classifyPlantListing
  const unitPrice = totalPrice;

  // ─── Sold Date ─────────────────────────────────────────────────────────
  const soldDate = normaliseDate(raw.endedAt);

  // ─── Title ─────────────────────────────────────────────────────────────
  const originalTitle = (raw.title ?? "").trim();
  const title = originalTitle.toLowerCase().replace(/\s+/g, " ").trim();

  // ─── Seller ────────────────────────────────────────────────────────────
  const seller = (raw.sellerUsername ?? "").trim();

  // ─── Condition ─────────────────────────────────────────────────────────
  const condition = (raw.condition ?? "").trim();

  // ─── URL ───────────────────────────────────────────────────────────────
  // Use raw.url from SoldComps — it is the actual sale URL for the correct
  // marketplace. Constructing ebay.co.uk/itm/{id} breaks for US sales because
  // the same item ID on ebay.co.uk shows a different active listing at a
  // different price, not the completed US sale.
  const rawUrl = (raw.url ?? "").trim();
  const url = rawUrl || (raw.itemId ? `https://www.ebay.com/itm/${raw.itemId}` : "");

  return {
    title,
    originalTitle,
    soldPrice,
    shippingPrice,
    totalPrice,
    unitPrice,
    currency,
    soldDate,
    seller,
    condition,
    url,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/**
 * Parse a price string like "£23.00" or "23.00" into a number.
 * Removes all non-numeric characters except . and -.
 */
function parsePrice(value: string | number | undefined | null): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;

  const cleaned = value
    .replace(/[^0-9.\-]/g, "") // Remove everything except digits, dots, minus
    .trim();

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse shipping string like "Free", "£5.00", or "5.00".
 * "Free" → 0, "£5.00" → 5.00
 */
function parseShipping(value: string | number | undefined | null): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;

  const lower = value.toLowerCase().trim();
  if (lower === "free" || lower === "freeshipping" || lower === "free shipping") {
    return 0;
  }

  return parsePrice(value);
}

/**
 * Normalise a date string into ISO format (YYYY-MM-DD).
 * Returns null if the date cannot be parsed.
 */
function normaliseDate(
  dateStr: string | undefined | null
): string | null {
  if (!dateStr) return null;

  // Try ISO format first
  const iso = /^\d{4}-\d{2}-\d{2}/;
  if (iso.test(dateStr)) {
    return dateStr.substring(0, 10);
  }

  // Try common eBay date formats
  // "Jan-11-26" or "01-Jan-26"
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().substring(0, 10);
  }

  // Try DD/MM/YYYY
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})/;
  const dmyMatch = dateStr.match(dmy);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
  }

  return null;
}