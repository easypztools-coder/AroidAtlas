export interface RetailStats {
  min: number;
  max: number;
  median: number;
  mean: number;
  trimmedMean: number;
  p25: number;
  p75: number;
  count: number;
}

export function calculateRetailStats(prices: number[]): RetailStats {
  const n = prices.length;
  if (n === 0) {
    return {
      min: 0,
      max: 0,
      median: 0,
      mean: 0,
      trimmedMean: 0,
      p25: 0,
      p75: 0,
      count: 0,
    };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[n - 1];
  const mean = sorted.reduce((a, b) => a + b, 0) / n;

  const p25 = percentile(sorted, 25);
  const p75 = percentile(sorted, 75);
  const median = percentile(sorted, 50);

  // Trimmed mean (excluding top and bottom 20% outliers)
  let trimmedMean = mean;
  const trimCount = Math.floor(n * 0.2);
  const trimmed = sorted.slice(trimCount, n - trimCount);
  if (trimmed.length > 0) {
    trimmedMean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  }

  return {
    min,
    max,
    median,
    mean,
    trimmedMean,
    p25,
    p75,
    count: n,
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const frac = index - lower;
  return sorted[lower] + frac * (sorted[upper] - sorted[lower]);
}
