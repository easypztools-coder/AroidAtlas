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

  const dupCheck = await db.query(`
    SELECT plant_slug, url, COUNT(*) as cnt
    FROM ebay_price_listings
    WHERE url <> ''
    GROUP BY plant_slug, url
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
    LIMIT 20
  `);
  console.log("Duplicate URL groups (top 20):");
  console.table(dupCheck.rows);

  const totalDupGroups = await db.query(`
    SELECT COUNT(*) as groups, SUM(extra) as extra_rows FROM (
      SELECT plant_slug, url, COUNT(*) - 1 as extra
      FROM ebay_price_listings
      WHERE url <> ''
      GROUP BY plant_slug, url
      HAVING COUNT(*) > 1
    ) sub
  `);
  console.log("Duplicate group summary:", totalDupGroups.rows);

  const totalRows = await db.query(`SELECT COUNT(*) as total FROM ebay_price_listings`);
  console.log("Total rows in ebay_price_listings:", totalRows.rows[0].total);

  const snapCount = await db.query(`SELECT plant_slug, COUNT(*) as snapshots FROM ebay_price_snapshots GROUP BY plant_slug ORDER BY snapshots DESC LIMIT 10`);
  console.log("Snapshots per plant (top 10):");
  console.table(snapCount.rows);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
