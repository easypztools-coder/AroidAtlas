import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import fs from "fs";
import path from "path";

function handleFilesystemFallback(slug: string) {
  const snapshotsDir = path.join(process.cwd(), "content", "retail-snapshots", slug);
  const latestPath = path.join(snapshotsDir, "latest.json");

  if (!fs.existsSync(latestPath)) {
    return NextResponse.json({
      success: true,
      slug,
      listings: [],
      statsByType: {},
      history: [],
      message: "No retail data available locally. Run scripts/fetch-retail-prices.ts first."
    });
  }

  try {
    const latestData = JSON.parse(fs.readFileSync(latestPath, "utf-8"));
    // Mirror the DB query: only return listings that were marked in-stock.
    const listings = (latestData.listings || []).filter(
      (l: Record<string, unknown>) => l.inStock !== false
    );
    const statsByType = latestData.statsByType || {};

    // Compile history
    const files = fs.readdirSync(snapshotsDir)
      .filter((f) => f.endsWith(".json") && f !== "latest.json")
      .sort();

    const history = [];
    for (const file of files) {
      try {
        const fileContent = fs.readFileSync(path.join(snapshotsDir, file), "utf-8");
        const fileData = JSON.parse(fileContent);
        if (fileData.statsByType && fileData.statsByType.all) {
          const stats = fileData.statsByType.all;
          history.push({
            date: fileData.checkedAt || stats.checkedAt,
            median: stats.median,
            trimmedMean: stats.trimmedMean,
            min: stats.min,
            max: stats.max,
            p25: stats.p25,
            p75: stats.p75,
            sampleSize: stats.count
          });
        }
      } catch (err) {
        console.error(`Error parsing historical retail snapshot ${file}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      slug,
      listings,
      statsByType,
      history
    });
  } catch (err) {
    console.error(`Failed to handle filesystem fallback for ${slug}:`, err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  const hasDb = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  if (!hasDb) {
    return handleFilesystemFallback(slug);
  }

  let listings: ReturnType<typeof mapListing>[] = [];

  // 1. Fetch active listings — this table is always present
  try {
    const db = getDbPool();
    const activeListingsRes = await db.query(
      `SELECT retailer_name, title, product_url, price_gbp, original_price_gbp,
              pot_size_cm, plant_size_label, source_method, last_seen_at
       FROM retail_price_observations
       WHERE plant_slug = $1 AND in_stock = true AND last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
       ORDER BY price_gbp ASC`,
      [slug]
    );
    listings = activeListingsRes.rows.map(mapListing);
  } catch (err) {
    console.error(`retail-market: failed to query retail_price_observations for ${slug}:`, err);
    return handleFilesystemFallback(slug);
  }

  // 2. Fetch snapshot stats — table may not exist yet on first deploy
  let statsByType: Record<string, unknown> = {};
  let history: ReturnType<typeof mapHistory>[] = [];

  try {
    const db = getDbPool();

    // Ensure the snapshots table exists so the cron can populate it
    await db.query(`
      CREATE TABLE IF NOT EXISTS retail_price_snapshots (
        id           SERIAL PRIMARY KEY,
        plant_slug   TEXT NOT NULL,
        item_type    TEXT NOT NULL DEFAULT 'all',
        checked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        observed_count INTEGER NOT NULL DEFAULT 0,
        min_price    NUMERIC(10,2),
        p25_price    NUMERIC(10,2),
        median_price NUMERIC(10,2),
        mean_price   NUMERIC(10,2),
        trimmed_mean_price NUMERIC(10,2),
        p75_price    NUMERIC(10,2),
        max_price    NUMERIC(10,2)
      )
    `);

    const latestSnapshotsRes = await db.query(
      `SELECT DISTINCT ON (item_type)
         item_type, checked_at, observed_count, min_price, p25_price,
         median_price, mean_price, trimmed_mean_price, p75_price, max_price
       FROM retail_price_snapshots
       WHERE plant_slug = $1
       ORDER BY item_type, checked_at DESC`,
      [slug]
    );

    statsByType = latestSnapshotsRes.rows.reduce((acc: Record<string, unknown>, row) => {
      acc[row.item_type] = {
        checkedAt: row.checked_at,
        count: row.observed_count,
        min: parseFloat(row.min_price),
        p25: parseFloat(row.p25_price),
        median: parseFloat(row.median_price),
        mean: parseFloat(row.mean_price),
        trimmedMean: parseFloat(row.trimmed_mean_price),
        p75: parseFloat(row.p75_price),
        max: parseFloat(row.max_price),
      };
      return acc;
    }, {});

    const historyRes = await db.query(
      `SELECT checked_at as date, median_price as median, trimmed_mean_price as "trimmedMean",
              min_price as min, max_price as max, observed_count as "sampleSize",
              p25_price as p25, p75_price as p75
       FROM retail_price_snapshots
       WHERE plant_slug = $1 AND item_type = 'all'
       ORDER BY checked_at ASC`,
      [slug]
    );

    history = historyRes.rows.map(mapHistory);
  } catch (err) {
    console.error(`retail-market: failed to query retail_price_snapshots for ${slug} (non-fatal):`, err);
    // listings is still populated — stats/history will be empty until next cron run
  }

  return NextResponse.json({
    success: true,
    slug,
    listings,
    statsByType,
    history,
  });
}

function mapListing(row: Record<string, unknown>) {
  return {
    retailerName: row.retailer_name,
    title: row.title,
    productUrl: row.product_url,
    priceGbp: parseFloat(row.price_gbp as string),
    originalPriceGbp: row.original_price_gbp ? parseFloat(row.original_price_gbp as string) : null,
    potSizeCm: row.pot_size_cm ? parseFloat(row.pot_size_cm as string) : null,
    plantSizeLabel: row.plant_size_label,
    sourceMethod: row.source_method,
    lastSeenAt: row.last_seen_at,
  };
}

function mapHistory(row: Record<string, unknown>) {
  return {
    date: row.date,
    median: parseFloat(row.median as string),
    trimmedMean: parseFloat(row.trimmedMean as string),
    min: parseFloat(row.min as string),
    max: parseFloat(row.max as string),
    p25: parseFloat(row.p25 as string),
    p75: parseFloat(row.p75 as string),
    sampleSize: row.sampleSize,
  };
}
