import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { getDbPool } from '@/lib/db';
import PriceIndexTable from '@/components/PriceIndexTable';
import type { PriceIndexRow } from '@/types/price-index';

export const revalidate = 3600;

const CANONICAL = 'https://aroidatlas.co.uk/price-index';

export const metadata: Metadata = {
  title: 'Plant Price Index — All Species | Aroid Atlas',
  description:
    'Live retail prices, market trends, and listing counts for 180+ rare tropical plants. Sort and filter by genus, rarity, price tier, and market status.',
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: 'Plant Price Index — All Species | Aroid Atlas',
    description:
      'Live retail prices, market trends, and listing counts for 180+ rare tropical plants. Sort and filter by genus, rarity, price tier, and market status.',
    url: CANONICAL,
    siteName: 'Aroid Atlas',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Plant Price Index — All Species | Aroid Atlas',
    description:
      'Live retail prices, market trends, and listing counts for 180+ rare tropical plants. Sort and filter by genus, rarity, price tier, and market status.',
  },
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

const QUERY_RETAIL_SNAPSHOTS = `
  SELECT DISTINCT ON (plant_slug)
    plant_slug, median_price
  FROM retail_price_snapshots
  WHERE item_type = 'all'
  ORDER BY plant_slug, checked_at DESC
`;

const QUERY_EBAY_SNAPSHOTS = `
  SELECT DISTINCT ON (plant_slug)
    plant_slug,
    median_price   AS ebay_median,
    accepted_count AS ebay_count
  FROM ebay_price_snapshots
  ORDER BY plant_slug, checked_at DESC
`;

async function buildRows(): Promise<PriceIndexRow[]> {
  const plantsRoot = path.join(process.cwd(), 'content', 'plants');
  const genera = fs
    .readdirSync(plantsRoot)
    .filter((g) => fs.statSync(path.join(plantsRoot, g)).isDirectory());

  type JsonRow = Omit<PriceIndexRow, 'dbMedianPrice' | 'ebayMedianPrice' | 'ebayDataPoints' | 'listingCount' | 'inStockCount' | 'retailerCount' | 'hasRetailData'>;
  const jsonRows: JsonRow[] = [];

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
  const retailSnapMap = new Map<string, number | null>();
  const ebayMap = new Map<string, { median: number | null; count: number | null }>();

  const hasDb = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
  if (hasDb) {
    try {
      const db = getDbPool();
      const [obsResult, retailSnapResult, ebayResult] = await Promise.all([
        db.query(QUERY_OBSERVATIONS),
        db.query(QUERY_RETAIL_SNAPSHOTS),
        db.query(QUERY_EBAY_SNAPSHOTS),
      ]);
      for (const row of obsResult.rows) {
        obsMap.set(row.plant_slug, {
          listingCount: Number(row.listing_count),
          inStockCount: Number(row.in_stock_count),
          retailerCount: Number(row.retailer_count),
        });
      }
      for (const row of retailSnapResult.rows) {
        retailSnapMap.set(row.plant_slug, row.median_price != null ? parseFloat(row.median_price) : null);
      }
      for (const row of ebayResult.rows) {
        ebayMap.set(row.plant_slug, {
          median: row.ebay_median != null ? parseFloat(row.ebay_median) : null,
          count: row.ebay_count != null ? Number(row.ebay_count) : null,
        });
      }
    } catch (err) {
      console.error('[price-index] DB query failed, showing JSON-only data:', err);
    }
  }

  return jsonRows.map((row) => {
    const obs = obsMap.get(row.slug);
    const ebay = ebayMap.get(row.slug);
    return {
      ...row,
      dbMedianPrice: retailSnapMap.get(row.slug) ?? null,
      ebayMedianPrice: ebay?.median ?? null,
      ebayDataPoints: ebay?.count ?? null,
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
  const withEbay = rows.filter((r) => r.ebayDataPoints != null).length;
  const inStock = rows.reduce((n, r) => n + r.inStockCount, 0);

  const datasetLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'Aroid Atlas UK Plant Price Index',
    description: `Live retail prices, eBay sold comparables, and market trends for ${rows.length} rare tropical plant species. Sourced from UK retailers and eBay UK sold listings.`,
    url: CANONICAL,
    creator: { '@type': 'Organization', name: 'Aroid Atlas', url: 'https://aroidatlas.co.uk' },
    license: 'https://creativecommons.org/licenses/by-nc/4.0/',
    variableMeasured: ['Retail price GBP', 'eBay sold median price GBP', 'Market trend', 'In-stock listings'],
    spatialCoverage: 'United Kingdom',
    temporalCoverage: '2024/..',
  };

  return (
    <main className="section-container py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetLd) }}
      />
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-semibold text-heading mb-2">Plant Price Index</h1>
        <p className="text-sm text-muted font-body max-w-2xl mb-5">
          Live retail prices, market trends, and listing counts across all species in the directory.
          Prices sourced from UK retailers and eBay sold listings. Click any column header to sort.
        </p>
        <div className="flex flex-wrap gap-5 text-xs text-muted font-body">
          <span><span className="font-semibold text-heading text-sm">{rows.length}</span> species catalogued</span>
          {withEbay > 0 && (
            <span><span className="font-semibold text-heading text-sm">{withEbay}</span> with eBay price data</span>
          )}
          {withRetail > 0 && (
            <span><span className="font-semibold text-heading text-sm">{withRetail}</span> with live retail data</span>
          )}
          {inStock > 0 && (
            <span><span className="font-semibold text-leaf text-sm">{inStock}</span> currently in stock</span>
          )}
        </div>
      </div>
      <PriceIndexTable rows={rows} />
    </main>
  );
}
