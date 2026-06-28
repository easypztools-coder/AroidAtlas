'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { PriceIndexRow } from '@/types/price-index';

type SortKey =
  | 'scientificName'
  | 'genus'
  | 'botanicalType'
  | 'rarityStatus'
  | 'priceGuideTier'
  | 'displayPrice'
  | 'ebayDataPoints'
  | 'threeMonthChangePercent'
  | 'marketStatus'
  | 'listingCount'
  | 'inStockCount'
  | 'retailerCount'
  | 'collectorPopularity';

const RARITY_ORDER: Record<string, number> = {
  Uncommon: 0,
  Rare: 1,
  'Very Rare': 2,
  'Ultra Rare': 3,
  'Extremely Rare': 4,
};

function getSortValue(row: PriceIndexRow, key: SortKey): string | number | null {
  switch (key) {
    case 'displayPrice':   return row.dbMedianPrice ?? row.currentMedianPriceGBP ?? null;
    case 'ebayDataPoints': return row.ebayDataPoints;
    case 'rarityStatus':   return RARITY_ORDER[row.rarityStatus] ?? -1;
    case 'priceGuideTier': return row.priceGuideTier.length;
    default:               return row[key] as string | number | null;
  }
}

interface ThHeaderProps {
  children: React.ReactNode;
  sortKey: SortKey;
  activeSortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
}

function ThHeader({ children, sortKey: k, activeSortKey, sortDir, onSort }: ThHeaderProps) {
  const isActive = k === activeSortKey;
  return (
    <th
      onClick={() => onSort(k)}
      className="px-3 py-3 text-left text-xs font-medium text-muted whitespace-nowrap sticky top-0 z-20 bg-[#FAF8F2] cursor-pointer select-none hover:text-heading transition-colors duration-100 border-b border-primary/10"
    >
      <span className="flex items-center gap-0.5">
        {children}
        <span className={`ml-0.5 text-[10px] ${isActive ? 'text-accent' : 'text-muted/30'}`}>
          {isActive ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
        </span>
      </span>
    </th>
  );
}

const SELECT_CLASS =
  'border border-border bg-surface rounded-sm px-3 py-1.5 text-xs text-heading outline-none focus:border-primary/40 transition-colors';

interface Props {
  rows: PriceIndexRow[];
}

export default function PriceIndexTable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('scientificName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [filterGenus, setFilterGenus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterRarity, setFilterRarity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasRetailOnly, setHasRetailOnly] = useState(false);

  const genera = useMemo(
    () => Array.from(new Set(rows.map((r) => r.genus))).sort(),
    [rows],
  );

  const types = useMemo(
    () => Array.from(new Set(rows.map((r) => r.botanicalType))).sort(),
    [rows],
  );

  const rarities = useMemo(
    () =>
      Array.from(new Set(rows.map((r) => r.rarityStatus).filter(Boolean))).sort(
        (a, b) => (RARITY_ORDER[a] ?? 0) - (RARITY_ORDER[b] ?? 0),
      ),
    [rows],
  );

  const displayed = useMemo(() => {
    let filtered = rows;
    if (filterGenus !== 'all') filtered = filtered.filter((r) => r.genus === filterGenus);
    if (filterType !== 'all') filtered = filtered.filter((r) => r.botanicalType === filterType);
    if (filterRarity !== 'all') filtered = filtered.filter((r) => r.rarityStatus === filterRarity);
    if (hasRetailOnly) filtered = filtered.filter((r) => r.hasRetailData);
    if (searchQuery.length >= 2) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.scientificName.toLowerCase().includes(q) ||
          r.commonName.toLowerCase().includes(q) ||
          r.genus.toLowerCase().includes(q),
      );
    }
    return [...filtered].sort((a, b) => {
      const av = getSortValue(a, sortKey);
      const bv = getSortValue(b, sortKey);
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, filterGenus, filterType, filterRarity, hasRetailOnly, searchQuery, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const thProps = { activeSortKey: sortKey, sortDir, onSort: handleSort };

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search species..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="border border-border bg-surface rounded-sm px-3 py-1.5 text-xs text-heading placeholder-muted/50 outline-none focus:border-primary/40 transition-colors w-44"
        />
        <select value={filterGenus} onChange={(e) => setFilterGenus(e.target.value)} className={SELECT_CLASS}>
          <option value="all">All Genera</option>
          {genera.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={SELECT_CLASS}>
          <option value="all">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <select value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)} className={SELECT_CLASS}>
          <option value="all">All Rarities</option>
          {rarities.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasRetailOnly}
            onChange={(e) => setHasRetailOnly(e.target.checked)}
            className="accent-primary"
          />
          Has retail data
        </label>
        <span className="ml-auto text-xs text-muted">
          {displayed.length === rows.length
            ? `${rows.length} plants`
            : `${displayed.length} of ${rows.length} plants`}
        </span>
      </div>

      {/* Table — contained scroll so sticky thead works */}
      <div className="glass-card">
        <div className="overflow-auto max-h-[75vh]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <ThHeader {...thProps} sortKey="scientificName">Plant</ThHeader>
                <ThHeader {...thProps} sortKey="genus">Genus</ThHeader>
                <ThHeader {...thProps} sortKey="botanicalType">Type</ThHeader>
                <ThHeader {...thProps} sortKey="rarityStatus">Rarity</ThHeader>
                <ThHeader {...thProps} sortKey="priceGuideTier">Tier</ThHeader>
                <ThHeader {...thProps} sortKey="displayPrice">Median £</ThHeader>
                <ThHeader {...thProps} sortKey="ebayDataPoints">eBay #</ThHeader>
                <ThHeader {...thProps} sortKey="threeMonthChangePercent">3M Change</ThHeader>
                <ThHeader {...thProps} sortKey="marketStatus">Market</ThHeader>
                <ThHeader {...thProps} sortKey="listingCount">Listings</ThHeader>
                <ThHeader {...thProps} sortKey="inStockCount">In Stock</ThHeader>
                <ThHeader {...thProps} sortKey="retailerCount">Retailers</ThHeader>
                <ThHeader {...thProps} sortKey="collectorPopularity">Popularity</ThHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {displayed.map((row) => {
                const genusSlug = row.genus.toLowerCase();

                return (
                  <tr
                    key={`${genusSlug}-${row.slug}`}
                    className="hover:bg-primary/[.025] transition-colors duration-100"
                  >
                    {/* Plant: image left, name right */}
                    <td className="px-3 py-2 min-w-[200px] max-w-[260px]">
                      <Link
                        href={`/plants/${genusSlug}/${row.slug}`}
                        className="flex items-start gap-2.5 group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/plants/${genusSlug}/${row.slug}.png`}
                          alt=""
                          aria-hidden="true"
                          width={28}
                          height={36}
                          className="object-cover rounded shrink-0 opacity-85 group-hover:opacity-100 transition-opacity mt-0.5"
                          style={{ width: 28, height: 36 }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <span className="text-xs font-medium italic text-heading group-hover:text-primary transition-colors leading-snug truncate">
                          {row.scientificName}
                        </span>
                      </Link>
                    </td>

                    {/* Genus */}
                    <td className="px-3 py-2 text-xs text-muted whitespace-nowrap">{row.genus}</td>

                    {/* Type */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs text-muted capitalize">{row.botanicalType}</span>
                    </td>

                    {/* Rarity */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-[10px] font-medium text-rarity">{row.rarityStatus}</span>
                    </td>

                    {/* Price guide tier */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className="text-xs font-medium text-accent">{row.priceGuideTier}</span>
                    </td>

                    {/* Median £ — retailer DB price, falling back to AI estimate */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {(() => {
                        const price = row.dbMedianPrice ?? row.currentMedianPriceGBP;
                        const isEstimate = !row.dbMedianPrice && row.estimatedSource === 'ai_estimate';
                        return price != null ? (
                          <span className={`text-xs font-medium ${isEstimate ? 'text-muted' : 'text-heading'}`}>
                            £{price.toFixed(0)}
                            {isEstimate && <sup className="text-[9px] ml-0.5" title="AI estimate">~</sup>}
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        );
                      })()}
                    </td>

                    {/* eBay # — number of sold listings the last price snapshot was based on */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {row.ebayDataPoints != null ? (
                        <span className="text-xs text-heading">{row.ebayDataPoints}</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    {/* 3M change */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.threeMonthChangePercent != null ? (
                        <span
                          className={`text-xs font-medium ${
                            row.threeMonthChangePercent > 0 ? 'text-leaf' : 'text-rarity'
                          }`}
                        >
                          {row.threeMonthChangePercent > 0 ? '↑' : '↓'}{' '}
                          {Math.abs(row.threeMonthChangePercent).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    {/* Market status */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {row.marketStatus ? (
                        <span
                          className={`text-xs font-medium ${
                            row.marketStatus === 'Rising'
                              ? 'text-leaf'
                              : row.marketStatus === 'Declining'
                              ? 'text-rarity'
                              : 'text-muted'
                          }`}
                        >
                          {row.marketStatus === 'Rising' ? '↑ ' : row.marketStatus === 'Declining' ? '↓ ' : '→ '}
                          {row.marketStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    {/* Listings */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {row.hasRetailData ? (
                        <span className="text-xs font-medium text-heading">{row.listingCount}</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    {/* In stock */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {row.hasRetailData ? (
                        <span
                          className={`text-xs font-medium ${
                            row.inStockCount > 0 ? 'text-leaf' : 'text-muted'
                          }`}
                        >
                          {row.inStockCount}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    {/* Retailers */}
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      {row.hasRetailData ? (
                        <span className="text-xs text-heading">{row.retailerCount}</span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>

                    {/* Collector popularity */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span
                        className="text-xs tracking-tight"
                        aria-label={`${row.collectorPopularity} out of 5`}
                      >
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={i < row.collectorPopularity ? 'text-accent' : 'text-border'}>
                            {i < row.collectorPopularity ? '●' : '○'}
                          </span>
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {displayed.length === 0 && (
            <div className="py-16 text-center text-sm text-muted">
              No plants match your current filters.
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <p className="text-[10px] text-muted/70 font-body">
        <strong>Median £<sup>~</sup></strong> — AI price estimate; no live retailer data yet for that species.
        <strong> eBay #</strong> — number of sold listings used in the latest eBay price snapshot.
        Retail listing counts cover the last 30 days.
      </p>
    </div>
  );
}
