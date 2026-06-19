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
    const listings = latestData.listings || [];
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

  try {
    const db = getDbPool();
    // 1. Get current active in-stock listings at UK retailers
    const activeListingsRes = await db.query(
      `SELECT retailer_name, title, product_url, price_gbp, original_price_gbp, 
              pot_size_cm, plant_size_label, source_method, last_seen_at
       FROM retail_price_observations
       WHERE plant_slug = $1 AND in_stock = true AND last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
       ORDER BY price_gbp ASC`,
      [slug]
    );

    const listings = activeListingsRes.rows.map((row) => ({
      retailerName: row.retailer_name,
      title: row.title,
      productUrl: row.product_url,
      priceGbp: parseFloat(row.price_gbp),
      originalPriceGbp: row.original_price_gbp ? parseFloat(row.original_price_gbp) : null,
      potSizeCm: row.pot_size_cm ? parseFloat(row.pot_size_cm) : null,
      plantSizeLabel: row.plant_size_label,
      sourceMethod: row.source_method,
      lastSeenAt: row.last_seen_at,
    }));

    // 2. Get latest statistics snapshots grouped by plant item type
    // PostgreSQL DISTINCT ON ensures we get the single newest checked_at row for each item_type
    const latestSnapshotsRes = await db.query(
      `SELECT DISTINCT ON (item_type) 
         item_type, checked_at, observed_count, min_price, p25_price, 
         median_price, mean_price, trimmed_mean_price, p75_price, max_price
       FROM retail_price_snapshots
       WHERE plant_slug = $1
       ORDER BY item_type, checked_at DESC`,
      [slug]
    );

    const statsByType = latestSnapshotsRes.rows.reduce((acc: any, row: any) => {
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

    // 3. Get historical retail snapshots series (using 'all' for trend chart)
    const historyRes = await db.query(
      `SELECT checked_at as date, median_price as median, trimmed_mean_price as "trimmedMean",
              min_price as min, max_price as max, observed_count as "sampleSize",
              p25_price as p25, p75_price as p75
       FROM retail_price_snapshots
       WHERE plant_slug = $1 AND item_type = 'all'
       ORDER BY checked_at ASC`,
      [slug]
    );

    const history = historyRes.rows.map((row) => ({
      date: row.date,
      median: parseFloat(row.median),
      trimmedMean: parseFloat(row.trimmedMean),
      min: parseFloat(row.min),
      max: parseFloat(row.max),
      p25: parseFloat(row.p25),
      p75: parseFloat(row.p75),
      sampleSize: row.sampleSize,
    }));

    return NextResponse.json({
      success: true,
      slug,
      listings,
      statsByType,
      history,
    });
  } catch (err) {
    console.error(`Failed to fetch retail market data for ${slug} from DB. Falling back to local files:`, err);
    return handleFilesystemFallback(slug);
  }
}
