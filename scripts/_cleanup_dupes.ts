import fs from "fs";
import path from "path";

const envLocalPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const envConfig = fs.readFileSync(envLocalPath, "utf-8");
  for (const line of envConfig.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...values] = trimmed.split("=");
      const value = values.join("=").trim().replace(/^['"]|['"]$/g, "");
      process.env[key.trim()] = value;
    }
  }
}

import { getDbPool } from "../src/lib/db";

async function main() {
  const db = getDbPool();

  const before = await db.query(`SELECT COUNT(*) as total FROM ebay_price_listings`);
  console.log("Rows before cleanup:", before.rows[0].total);

  const deleted = await db.query(`
    DELETE FROM ebay_price_listings
    WHERE url <> ''
      AND id NOT IN (
        SELECT MIN(id)
        FROM ebay_price_listings
        WHERE url <> ''
        GROUP BY plant_slug, url
      )
    RETURNING id
  `);
  console.log(`Deleted ${deleted.rowCount} duplicate rows.`);

  await db.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ebay_listings_plant_url
      ON ebay_price_listings(plant_slug, url) WHERE url <> ''
  `);
  console.log("Unique index ensured: idx_ebay_listings_plant_url");

  const after = await db.query(`SELECT COUNT(*) as total FROM ebay_price_listings`);
  console.log("Rows after cleanup:", after.rows[0].total);

  const remainingDupes = await db.query(`
    SELECT COUNT(*) as groups FROM (
      SELECT plant_slug, url
      FROM ebay_price_listings
      WHERE url <> ''
      GROUP BY plant_slug, url
      HAVING COUNT(*) > 1
    ) sub
  `);
  console.log("Remaining duplicate groups:", remainingDupes.rows[0].groups);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
