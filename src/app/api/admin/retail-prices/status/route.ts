import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_PRICE_SECRET;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret") || request.headers.get("x-admin-secret");

  if (!ADMIN_SECRET) {
    return NextResponse.json(
      { error: "ADMIN_PRICE_SECRET not configured on server" },
      { status: 500 }
    );
  }

  if (!secret || secret !== ADMIN_SECRET) {
    return NextResponse.json({ error: "Invalid or missing secret" }, { status: 401 });
  }

  const db = getDbPool();

  try {
    // 1. Get last successful run
    const lastRunRes = await db.query(
      `SELECT * FROM retail_scrape_runs 
       WHERE status = 'completed' 
       ORDER BY started_at DESC LIMIT 1`
    );
    const lastSuccessfulRun = lastRunRes.rows[0] || null;

    // 2. Get last run overall (whether completed or failed)
    const latestRunRes = await db.query(
      `SELECT * FROM retail_scrape_runs 
       ORDER BY started_at DESC LIMIT 1`
    );
    const latestRun = latestRunRes.rows[0] || null;

    // 3. Get pending review queue count
    const reviewQueueRes = await db.query(
      `SELECT COUNT(*) as count FROM retail_price_review_queue 
       WHERE status = 'pending'`
    );
    const reviewQueueCount = parseInt(reviewQueueRes.rows[0]?.count || "0", 10);

    // 4. Products whose price changed in the last 7 days
    const priceChangesRes = await db.query(
      `SELECT plant_slug, retailer_name, title, product_url, price_gbp, previous_price_gbp, last_price_change_at 
       FROM retail_price_observations 
       WHERE previous_price_gbp IS NOT NULL AND last_price_change_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' 
       ORDER BY last_price_change_at DESC LIMIT 100`
    );
    const priceChanges = priceChangesRes.rows.map((row) => ({
      plantSlug: row.plant_slug,
      retailerName: row.retailer_name,
      title: row.title,
      productUrl: row.product_url,
      priceGbp: parseFloat(row.price_gbp),
      previousPriceGbp: parseFloat(row.previous_price_gbp),
      lastPriceChangeAt: row.last_price_change_at,
    }));

    // 5. Active errors in the last 7 days
    const recentErrorsRes = await db.query(
      `SELECT e.id, e.retailer_slug, e.extraction_method, e.error_message, e.time, e.run_id 
       FROM retail_scrape_errors e
       WHERE e.time >= CURRENT_TIMESTAMP - INTERVAL '7 days'
       ORDER BY e.time DESC LIMIT 50`
    );
    const recentErrors = recentErrorsRes.rows;

    // 6. Retailers requiring selector updates (had errors in the last 7 days)
    const selectorUpdatesRes = await db.query(
      `SELECT DISTINCT retailer_slug, COUNT(*) as error_count 
       FROM retail_scrape_errors 
       WHERE time >= CURRENT_TIMESTAMP - INTERVAL '7 days' 
       GROUP BY retailer_slug 
       ORDER BY error_count DESC`
    );
    const retailersRequiringSelectorUpdates = selectorUpdatesRes.rows.map((row) => ({
      retailerSlug: row.retailer_slug,
      errorCount: parseInt(row.error_count, 10),
    }));

    // 7. General Retailer Status mapping
    // Query active observations count per retailer in the last 7 days
    const activeObsRes = await db.query(
      `SELECT retailer_slug, retailer_name, COUNT(*) as active_count, MAX(last_seen_at) as last_seen 
       FROM retail_price_observations 
       WHERE last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' 
       GROUP BY retailer_slug, retailer_name`
    );
    const retailerStatus = activeObsRes.rows.map((row) => {
      const hasErrors = retailersRequiringSelectorUpdates.some(
        (r) => r.retailerSlug === row.retailer_slug
      );
      return {
        retailerSlug: row.retailer_slug,
        retailerName: row.retailer_name,
        activeProductsCount: parseInt(row.active_count, 10),
        lastSeenAt: row.last_seen,
        status: hasErrors ? "error" : "healthy",
      };
    });

    return NextResponse.json({
      success: true,
      lastSuccessfulRun: lastSuccessfulRun
        ? {
            id: lastSuccessfulRun.id,
            startedAt: lastSuccessfulRun.started_at,
            completedAt: lastSuccessfulRun.completed_at,
            retailerCount: lastSuccessfulRun.retailer_count,
            fetchedProductCount: lastSuccessfulRun.fetched_product_count,
            acceptedCount: lastSuccessfulRun.accepted_count,
            reviewCount: lastSuccessfulRun.review_count,
            rejectedCount: lastSuccessfulRun.rejected_count,
            errorCount: lastSuccessfulRun.error_count,
          }
        : null,
      latestRun: latestRun
        ? {
            id: latestRun.id,
            startedAt: latestRun.started_at,
            completedAt: latestRun.completed_at,
            status: latestRun.status,
            errorCount: latestRun.error_count,
          }
        : null,
      reviewQueueCount,
      retailerStatus,
      priceChanges,
      recentErrors,
      retailersRequiringSelectorUpdates,
    });
  } catch (err) {
    console.error("Failed to query status metrics:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
