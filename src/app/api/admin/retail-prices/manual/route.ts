import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";
import { calculateRetailStats } from "@/lib/retail/stats";
import { normaliseString } from "@/lib/retail/matcher";

const ADMIN_SECRET = process.env.ADMIN_PRICE_SECRET;

export async function POST(request: NextRequest) {
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

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    plantSlug,
    retailerName,
    title,
    productUrl,
    priceGbp,
    itemType,
    inStock,
    checkedAt,
  } = body;

  if (!plantSlug || !retailerName || !title || !productUrl || priceGbp === undefined) {
    return NextResponse.json(
      { error: "Missing required fields: plantSlug, retailerName, title, productUrl, priceGbp" },
      { status: 400 }
    );
  }

  const price = parseFloat(priceGbp);
  if (isNaN(price) || price <= 0) {
    return NextResponse.json({ error: "Invalid priceGbp" }, { status: 400 });
  }

  const db = getDbPool();
  const retailerSlug = normaliseString(retailerName).replace(/\s+/g, "-");
  const checkedDate = checkedAt || new Date().toISOString();
  const labelType = itemType || "unknown";

  try {
    // 1. Upsert manual observation using deduplication logic
    const existingRes = await db.query(
      "SELECT id, price_gbp FROM retail_price_observations WHERE retailer_slug = $1 AND product_url = $2",
      [retailerSlug, productUrl]
    );

    if (existingRes.rows.length === 0) {
      await db.query(
        `INSERT INTO retail_price_observations (
          plant_slug, retailer_slug, retailer_name, title, product_url,
          price_gbp, original_price_gbp, previous_price_gbp, in_stock,
          variant_title, pot_size_cm, plant_size_label, source_method, match_confidence,
          first_seen_at, last_seen_at, last_price_change_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, NULL, NULL, $8, 'manual', 1.0, $9, $9, $9)`,
        [
          plantSlug,
          retailerSlug,
          retailerName,
          title,
          productUrl,
          price,
          inStock !== false,
          labelType,
          checkedDate,
        ]
      );
    } else {
      const existing = existingRes.rows[0];
      const oldPrice = parseFloat(existing.price_gbp);

      if (Math.abs(oldPrice - price) > 0.01) {
        await db.query(
          `UPDATE retail_price_observations SET
            plant_slug = $1,
            retailer_name = $2,
            title = $3,
            price_gbp = $4,
            previous_price_gbp = $5,
            in_stock = $6,
            plant_size_label = $7,
            source_method = 'manual',
            match_confidence = 1.0,
            last_seen_at = $8,
            last_price_change_at = $8,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $9`,
          [
            plantSlug,
            retailerName,
            title,
            price,
            oldPrice,
            inStock !== false,
            labelType,
            checkedDate,
            existing.id,
          ]
        );
      } else {
        await db.query(
          `UPDATE retail_price_observations SET
            plant_slug = $1,
            retailer_name = $2,
            title = $3,
            in_stock = $4,
            plant_size_label = $5,
            source_method = 'manual',
            match_confidence = 1.0,
            last_seen_at = $6,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $7`,
          [
            plantSlug,
            retailerName,
            title,
            inStock !== false,
            labelType,
            checkedDate,
            existing.id,
          ]
        );
      }
    }

    // 2. Re-calculate and insert retail_price_snapshots immediately
    const obsRes = await db.query(
      `SELECT price_gbp, plant_size_label 
       FROM retail_price_observations 
       WHERE plant_slug = $1 AND in_stock = true AND last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'`,
      [plantSlug]
    );

    const observations = obsRes.rows;
    if (observations.length > 0) {
      const pricesByType: Record<string, number[]> = { all: [] };
      for (const obs of observations) {
        const p = parseFloat(obs.price_gbp);
        const t = obs.plant_size_label || "unknown";
        pricesByType.all.push(p);
        if (!pricesByType[t]) pricesByType[t] = [];
        pricesByType[t].push(p);
      }

      for (const [type, prices] of Object.entries(pricesByType)) {
        if (prices.length === 0) continue;
        const stats = calculateRetailStats(prices);

        await db.query(
          `INSERT INTO retail_price_snapshots (
             plant_slug, item_type, checked_at, currency, observed_count,
             min_price, p25_price, median_price, mean_price, trimmed_mean_price, p75_price, max_price
           ) VALUES ($1, $2, $3, 'GBP', $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            plantSlug,
            type,
            checkedDate,
            stats.count,
            stats.min,
            stats.p25,
            stats.median,
            stats.mean,
            stats.trimmedMean,
            stats.p75,
            stats.max,
          ]
        );
      }
    }

    return NextResponse.json({ success: true, plantSlug, retailerSlug, price });
  } catch (err) {
    console.error("Failed to insert manual retail price:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
