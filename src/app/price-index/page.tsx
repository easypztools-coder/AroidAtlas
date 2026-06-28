import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { getDbPool } from '@/lib/db';
import PriceIndexTable from '@/components/PriceIndexTable';
import type { PriceIndexRow } from '@/types/price-index';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Plant Price Index — All Species | Aroid Atlas',
  description:
    'Live retail prices, market trends, and listing counts for 180+ rare tropical plants. Sort and filter by genus, rarity, price tier, and market status.',
};

const QUERY_OBSERVATIONS = `
  SELECT
    plant_slug,
    COUNT(*)                                        AS listing_count,
    COUNT(*) FILTER (WHERE in_stock = TRUE)         AS in_stock_count,
    COUNT(DISTINCT retailer_slug)                   AS retailer_count
  FROM retail_price_observations
  WHERE last_seen_at >= CURRENT_TIMESTAMP - INTERVAL '30 days'
  GROUP BY plant_slug
`;

const QUERY_SNAPSHOTS = `
  SELECT DISTINCT ON (plant_slug)
    plant_slug, median_price
  FROM retail_price_snapshots
  WHERE item_type = 'all'
  ORDER BY plant_slug, checked_at DESC
`;

async function buildRows(): Promise<PriceIndexRow[]> {
  const plantsRoot = path.join(process.cwd(), 'content', 'plants');
  const genera = fs
    .readdirSync(plantsRoot)
    .filter((g) => fs.statSync(path.join(plantsRoot, g)).isDirectory());

  const jsonRows: Omit<PriceIndexRow, 'dbMedianPrice' | 'listingCount' | 'inStockCount' | 'retailerCount' | 'hasRetailData'>[] = [];

  for (const genus of genera) {
    const genusDir = path.join(plantsRoot, genus);
    const files = fs.readdirSync(genusDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(genusDir, file), 'utf-8'));
        jsonRows.push({
          slug: data.slug,
          genus: data.genus,
          name: data.name,
          scientificName: data.scientificName,
          commonName: data.commonName ?? '',
          botanicalType: data.botanicalType || 'species',
          rarityStatus: data.rarityStatus ?? '',
          priceGuideTier: data.priceGuideTier ?? '',
          collectorPopularity: data.collectorPopularity ?? 0,
          currentMedianPriceGBP: data.marketMetrics?.currentMedianPriceGBP ?? null,
          estimatedSource: data.marketMetrics?.estimatedSource ?? null,
          threeMonthChangePercent: data.marketMetrics?.threeMonthChangePercent ?? null,
          marketStatus: data.marketMetrics?.marketStatus ?? null,
        });
      } catch {
        // skip malformed JSON
      }
    }
  }

  const obsMap = new Map<string, { listingCount: number; inStockCount: number; retailerCount: number }>();
  const snapMap = new Map<string, number | null>();

  const hasDb = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  if (hasDb) {
    try {
      const db = getDbPool();
      const [obsResult, snapResult] = await Promise.all([
        db.query(QUERY_OBSERVATIONS),
        db.query(QUERY_SNAPSHOTS),
      ]);
      for (const row of obsResult.rows) {
        obsMap.set(row.plant_slug, {
          listingCount: Number(row.listing_count),
          inStockCount: Number(row.in_stock_count),
          retailerCount: Number(row.retailer_count),
        });
      }
      for (const row of snapResult.rows) {
        snapMap.set(row.plant_slug, row.median_price != null ? parseFloat(row.median_price) : null);
      }
    } catch (err) {
      console.error('[price-index] DB query failed, showing JSON-only data:', err);
    }
  }

  return jsonRows.map((row) => {
    const obs = obsMap.get(row.slug);
    const dbMedianPrice = snapMap.get(row.slug) ?? null;
    return {
      ...row,
      dbMedianPrice,
      listingCount: obs?.listingCount ?? 0,
      inStockCount: obs?.inStockCount ?? 0,
      retailerCount: obs?.retailerCount ?? 0,
      hasRetailData: obs != null,
    };
  });
}

export default async function PriceIndexPage() {
  const rows = await buildRows();
  const withRetail = rows.filter((r) => r.hasRetailData).length;
  const inStock = rows.reduce((n, r) => n + r.inStockCount, 0);

  return (
    <main className="section-container py-12">
      <div className="mb-8">
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="font-heading text-3xl font-semibold text-heading">Plant Price Index</h1>
        </div>
        <p className="text-sm text-muted font-body max-w-2xl mb-5">
          Live retail prices, market trends, and listing counts across all species in the directory.
          Prices sourced from UK retailers and eBay sold listings. Click any column header to sort.
        </p>
        <div className="flex flex-wrap gap-5 text-xs text-muted font-body">
          <span>
            <span className="font-semibold text-heading text-sm">{rows.length}</span>{' '}
            species catalogued
          </span>
          {withRetail > 0 && (
            <span>
              <span className="font-semibold text-heading text-sm">{withRetail}</span>{' '}
              with live retail data
            </span>
          )}
          {inStock > 0 && (
            <span>
              <span className="font-semibold text-leaf text-sm">{inStock}</span>{' '}
              currently in stock
            </span>
          )}
        </div>
      </div>
      <PriceIndexTable rows={rows} />
    </main>
  );
}
