import { NextRequest, NextResponse } from "next/server";
import { loadLatestSnapshot } from "@/lib/prices/database";
import { PriceHistoryResponse } from "@/lib/prices/types";

/**
 * ─── PUBLIC PRICE HISTORY ─────────────────────────────────────────────────
 *
 * Read-only endpoint: /api/plants/[slug]/price-history
 *
 * Returns saved snapshots only.
 * Never calls SoldComps.
 * Safe for public consumption.
 *
 * ──────────────────────────────────────────────────────────────────────────
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: "Missing slug parameter" }, { status: 400 });
  }

  const snapshot = await loadLatestSnapshot(slug);

  if (!snapshot) {
    return NextResponse.json(
      {
        slug,
        history: [],
        message: "No price data available yet. Run the admin update endpoint first.",
      },
      { status: 200 }
    );
  }

  const response: PriceHistoryResponse = {
    slug,
    history: [
      {
        date: snapshot.snapshot.checkedAt,
        median: snapshot.snapshot.medianPrice,
        p25: snapshot.snapshot.p25Price,
        p75: snapshot.snapshot.p75Price,
        min: snapshot.snapshot.minPrice,
        max: snapshot.snapshot.maxPrice,
        sampleSize: snapshot.snapshot.rawResultCount,
        confidenceScore: snapshot.snapshot.confidenceScore,
      },
    ],
  };

  return NextResponse.json(response);
}