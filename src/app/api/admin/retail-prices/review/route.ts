import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/db";

const ADMIN_SECRET = process.env.ADMIN_PRICE_SECRET;

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function checkAuth(request: NextRequest): boolean {
  if (!ADMIN_SECRET) return false;
  const secret =
    request.nextUrl.searchParams.get("secret") ||
    request.headers.get("x-admin-secret");
  return secret === ADMIN_SECRET;
}

/** GET /api/admin/retail-prices/review?secret=... — list pending review items */
export async function GET(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();

  const db = getDbPool();

  try {
    const res = await db.query(
      `SELECT id, retailer_slug, product_title, product_url,
              proposed_plant_slug, match_confidence, proposed_item_type,
              price_gbp, reason, status, created_at
       FROM retail_price_review_queue
       WHERE status = 'pending'
       ORDER BY match_confidence DESC, created_at DESC`
    );

    const totalRes = await db.query(
      `SELECT COUNT(*)::int AS total FROM retail_price_review_queue WHERE status = 'pending'`
    );

    return NextResponse.json({
      items: res.rows.map((r) => ({
        id: r.id,
        retailerSlug: r.retailer_slug,
        productTitle: r.product_title,
        productUrl: r.product_url,
        proposedPlantSlug: r.proposed_plant_slug,
        matchConfidence: parseFloat(r.match_confidence),
        proposedItemType: r.proposed_item_type,
        priceGbp: parseFloat(r.price_gbp),
        reason: r.reason,
        status: r.status,
        createdAt: r.created_at,
      })),
      total: totalRes.rows[0]?.total ?? 0,
    });
  } catch (err) {
    console.error("[review] GET failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

/** POST /api/admin/retail-prices/review?secret=... — accept or reject one item */
export async function POST(request: NextRequest) {
  if (!checkAuth(request)) return unauthorized();

  let body: { id: number; action: "accept" | "reject" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, action } = body;
  if (!id || (action !== "accept" && action !== "reject")) {
    return NextResponse.json(
      { error: "Body must be { id: number, action: 'accept' | 'reject' }" },
      { status: 400 }
    );
  }

  const db = getDbPool();

  try {
    // Fetch the queue item
    const itemRes = await db.query(
      `SELECT * FROM retail_price_review_queue WHERE id = $1`,
      [id]
    );

    if (itemRes.rows.length === 0) {
      return NextResponse.json({ error: `Queue item ${id} not found` }, { status: 404 });
    }

    const item = itemRes.rows[0];

    if (action === "accept") {
      // Insert into retail_price_observations so it shows on the plant page
      await db.query(
        `INSERT INTO retail_price_observations (
           plant_slug, retailer_slug, retailer_name, title, product_url,
           price_gbp, in_stock, plant_size_label, source_method, match_confidence,
           first_seen_at, last_seen_at, last_price_change_at
         ) VALUES ($1, $2, $3, $4, $5, $6, true, $7, 'manual', $8,
                   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (retailer_slug, product_url) DO UPDATE SET
           plant_slug       = EXCLUDED.plant_slug,
           price_gbp        = EXCLUDED.price_gbp,
           plant_size_label = EXCLUDED.plant_size_label,
           match_confidence = EXCLUDED.match_confidence,
           last_seen_at     = CURRENT_TIMESTAMP,
           updated_at       = CURRENT_TIMESTAMP`,
        [
          item.proposed_plant_slug,
          item.retailer_slug,
          item.retailer_slug.replace(/-/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
          item.product_title,
          item.product_url,
          item.price_gbp,
          item.proposed_item_type,
          1.0, // manually reviewed = max confidence
        ]
      );
    }

    // Mark item reviewed
    await db.query(
      `UPDATE retail_price_review_queue
       SET status = $1, reviewed_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [action === "accept" ? "accepted" : "rejected", id]
    );

    return NextResponse.json({ success: true, id, action });
  } catch (err) {
    console.error("[review] POST failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
