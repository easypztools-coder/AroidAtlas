/**
 * ─── TEST SOLDCOMPS ────────────────────────────────────────────────────────
 *
 * Dry-run test for the SoldComps API integration.
 *
 * Usage:
 *   npx tsx scripts/test-soldcomps.ts
 *
 * Requires:
 *   - SOLDCOMPS_API_KEY env var set
 *
 * What it does:
 *   1. Calls fetchSoldCompsRaw with a test query
 *   2. Normalises the first 5 results
 *   3. Logs the raw + normalised output
 *   4. Does NOT save to the database
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

import { fetchSoldCompsRaw } from "../src/lib/prices/soldcomps";
import { normaliseListing } from "../src/lib/prices/normaliseListing";

async function main() {
  const query = "Philodendron spiritus sancti";

  console.log("=".repeat(60));
  console.log("  SOLDCOMPS TEST");
  console.log("=".repeat(60));
  console.log(`\nQuery: "${query}"\n`);

  try {
    // 1. Fetch
    const raw = await fetchSoldCompsRaw({ query, maxResults: 10 });

    console.log(`\n✓ Fetched ${raw.length} raw items\n`);

    // 2. Normalise
    const normalised = raw.map(normaliseListing);

    // 3. Log first 5
    console.log("─".repeat(60));
    console.log("  First 5 normalised listings:\n");

    normalised.slice(0, 5).forEach((item, i) => {
      console.log(`  [${i + 1}]`);
      console.log(`      Title:       ${item.originalTitle}`);
      console.log(`      Price:       £${item.soldPrice.toFixed(2)}`);
      console.log(`      Shipping:    £${item.shippingPrice.toFixed(2)}`);
      console.log(`      Total:       £${item.totalPrice.toFixed(2)}`);
      console.log(`      Currency:    ${item.currency}`);
      console.log(`      Date:        ${item.soldDate}`);
      console.log(`      Seller:      ${item.seller}`);
      console.log(`      URL:         ${item.url}`);
      console.log();
    });

    // 4. Summary
    console.log("─".repeat(60));
    console.log(`\n  Summary:`);
    console.log(`    Total fetched:    ${raw.length}`);
    console.log(`    Total normalised: ${normalised.length}`);
    console.log(`    Sample (first 5): shown above`);

    console.log("\n✓ Test passed. No data saved to database.\n");
  } catch (err) {
    console.error("\n✗ Test failed:");
    console.error(`   ${err instanceof Error ? err.message : String(err)}\n`);
    process.exit(1);
  }
}

main();