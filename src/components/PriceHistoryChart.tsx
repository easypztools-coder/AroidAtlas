"use client";

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend,
} from "recharts";
import type { PriceHistoryPoint } from "@/lib/prices/types";

interface PriceHistoryChartProps {
  data: PriceHistoryPoint[];
}

const MEDIAN_COLOR = "#C3D9A1";
const BAND_COLOR = "#A3C17A";
const TEXT_MUTED = "#8B9A92";
const BG_CARD = "#1A1F1D";

/**
 * PriceHistoryChart — Dark luxury AroidAtlas aesthetic.
 *
 * Shows:
 * - Median price as a solid green line
 * - p25-p75 range as a translucent green band
 * - Legend explaining the visual elements
 * - Sample size / confidence displayed beneath
 */
export default function PriceHistoryChart({
  data,
}: PriceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl bg-card p-6 text-center">
        <p className="text-sm text-muted">No price data available yet.</p>
        <p className="mt-2 text-xs text-muted/60">
          Run the admin price update endpoint to fetch the first snapshot.
        </p>
      </div>
    );
  }

  const totalSamples = data.reduce((sum, d) => sum + d.sampleSize, 0);

  return (
    <div className="space-y-4">
      {/* ─── Chart ──────────────────────────────────────────────────────── */}
      <div className="h-64 md:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#2A2F2D"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => {
                const date = new Date(d);
                return date.toLocaleDateString("en-GB", {
                  month: "short",
                  year: "2-digit",
                });
              }}
              stroke={TEXT_MUTED}
              fontSize={10}
              tickLine={false}
            />
            <YAxis
              stroke={TEXT_MUTED}
              fontSize={10}
              tickLine={false}
              tickFormatter={(v) => `£${v.toFixed(0)}`}
              domain={[0, "auto"]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: BG_CARD,
                border: "1px solid #2A2F2D",
                borderRadius: "8px",
                fontSize: "12px",
                color: "#FFFFFF",
              }}
              labelFormatter={(d) => {
                const date = new Date(d);
                return date.toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                });
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: unknown, name: any) => {
                const num =
                  typeof value === "number"
                    ? value
                    : parseFloat(String(value ?? "0"));
                const labelMap: Record<string, string> = {
                  median: "Median",
                  p25: "25th Percentile",
                  p75: "75th Percentile",
                };
                const key = name ?? "";
                return [
                  `£${(num || 0).toFixed(2)}`,
                  labelMap[key] ?? key,
                ];
              }}
            />

            {/* Custom legend rendered manually instead of recharts Legend component */}
            <Legend
              content={() => (
                <div className="flex items-center justify-center gap-4 pt-2 pb-1">
                  <div className="flex items-center gap-1.5">
                    <div className="h-0.5 w-4 bg-[#C3D9A1]" />
                    <span className="text-[10px] text-[#8B9A92]">Median Price</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-4 rounded-sm bg-[#A3C17A]/20 border border-dashed border-[#A3C17A]" />
                    <span className="text-[10px] text-[#8B9A92]">25th–75th Percentile</span>
                  </div>
                </div>
              )}
            />

            {/* p25–p75 range band (renders behind median line) */}
            <defs>
              <linearGradient id="p25p75Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BAND_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={BAND_COLOR} stopOpacity={0.05} />
              </linearGradient>
            </defs>

            {/* Upper bound of band (p75) filled with gradient */}
            <Area
              type="monotone"
              dataKey="p75"
              stroke="none"
              fill="url(#p25p75Grad)"
              fillOpacity={1}
            />
            {/* Lower bound of band (p25) — same fill, hides lower portion */}
            <Area
              type="monotone"
              dataKey="p25"
              stroke="none"
              fill={BG_CARD}
              fillOpacity={1}
            />
            {/* Band outline — faint dashed lines for p25 and p75 */}
            <Line
              type="monotone"
              dataKey="p75"
              stroke={BAND_COLOR}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
              legendType="none"
            />
            <Line
              type="monotone"
              dataKey="p25"
              stroke={BAND_COLOR}
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              activeDot={false}
              legendType="none"
            />

            {/* Median line */}
            <Line
              type="monotone"
              dataKey="median"
              stroke={MEDIAN_COLOR}
              strokeWidth={2}
              dot={{ fill: MEDIAN_COLOR, strokeWidth: 0, r: 4 }}
              activeDot={{ fill: MEDIAN_COLOR, strokeWidth: 0, r: 6 }}
              name="median"
              legendType="line"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ─── Stats Footer ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-card/80 pt-3 text-xs">
        <div className="flex flex-col gap-1">
          <span className="text-muted">eBay UK sold prices</span>
          <span className="text-muted/60">
            Based on filtered completed listings. Excludes unrelated species,
            multipacks and statistical outliers.
          </span>
        </div>
        <span className="text-muted">{totalSamples} sales</span>
      </div>
    </div>
  );
}