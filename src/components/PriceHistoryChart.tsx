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
  onHover?: (date: string | null) => void;
  highlightedDate?: string | null;
}

function getISOWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

// Botanical-atlas palette for the chart
const MEDIAN_COLOR = "#153328";   // Deep botanical green — main trend line
const BAND_COLOR = "#496B55";     // Leaf green — price range band
const TEXT_MUTED = "#7C837E";     // Muted text
const BG_SURFACE = "#FAF8F2";     // Warm surface
const BG_TOOLTIP = "#FAF8F2";
const BORDER_COLOR = "#D8D0C1";   // Warm border

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  const byKey: Record<string, number> = {};
  for (const entry of payload) {
    byKey[entry.dataKey] = typeof entry.value === "number" ? entry.value : 0;
  }

  const median = byKey["median"];
  const p25 = byKey["p25"];
  const p75 = byKey["p75"];
  const sampleSize: number = payload[0]?.payload?.sampleSize ?? 0;

  const date = new Date(label);
  const weekLabel = date.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        backgroundColor: BG_TOOLTIP,
        border: `1px solid ${BORDER_COLOR}66`,
        borderRadius: "8px",
        padding: "10px 14px",
        fontSize: "12px",
        color: "#173229",
        minWidth: "180px",
        boxShadow: "0 2px 8px rgba(21, 51, 40, 0.10)",
      }}
    >
      <p style={{ color: TEXT_MUTED, fontSize: "10px", marginBottom: "8px" }}>
        {weekLabel}
      </p>
      {median !== undefined && (
        <div style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <span style={{ color: TEXT_MUTED }}>Most common price</span>
          <span style={{ color: MEDIAN_COLOR, fontWeight: 700 }}>£{median.toFixed(2)}</span>
        </div>
      )}
      {p25 !== undefined && p75 !== undefined && (
        <div style={{ marginBottom: "4px", display: "flex", justifyContent: "space-between", gap: "16px" }}>
          <span style={{ color: TEXT_MUTED }}>Typical range</span>
          <span style={{ color: BAND_COLOR }}>£{p25.toFixed(0)} – £{p75.toFixed(0)}</span>
        </div>
      )}
      {sampleSize > 0 && (
        <p style={{ color: TEXT_MUTED, fontSize: "10px", marginTop: "8px", borderTop: `1px solid ${BORDER_COLOR}`, paddingTop: "6px" }}>
          Based on {sampleSize} sale{sampleSize !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

export function PriceHistoryChartSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-64 animate-pulse rounded-xl border border-border/40 bg-surface p-3 md:h-72 shadow-card-sm">
        <div className="flex h-full flex-col justify-between">
          <div className="h-3 w-24 rounded bg-background-soft" />
          <div className="flex flex-1 items-end gap-2 pb-2 pt-4">
            {[40, 65, 50, 80, 60, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t bg-background-soft" style={{ height: `${h}%` }} />
            ))}
          </div>
          <div className="h-2.5 w-full rounded bg-background-soft" />
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-border/30 pt-3 text-xs">
        <div className="flex flex-col gap-1.5">
          <div className="h-2.5 w-28 animate-pulse rounded bg-background-soft" />
          <div className="h-2 w-44 animate-pulse rounded bg-background-soft" />
        </div>
        <div className="h-2.5 w-14 animate-pulse rounded bg-background-soft" />
      </div>
    </div>
  );
}

export default function PriceHistoryChart({ data, onHover, highlightedDate }: PriceHistoryChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-border/40 bg-background-soft p-6 text-center">
        <p className="text-sm text-muted">Not enough sales data to build a price graph yet.</p>
        <p className="mt-1 text-xs text-muted/60">Check back as more listings are tracked over time.</p>
      </div>
    );
  }

  const totalSamples = data.reduce((sum, d) => sum + d.sampleSize, 0);

  return (
    <div className="space-y-4">
      <div className="h-64 rounded-xl border border-border/40 bg-surface p-3 md:h-72 shadow-card-sm">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 5, left: -15, bottom: 0 }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onMouseMove={(state: any) => {
              if (state?.isTooltipActive && state?.activePayload?.length > 0) {
                onHover?.(state.activePayload[0].payload.date as string);
              }
            }}
            onMouseLeave={() => onHover?.(null)}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={BORDER_COLOR}
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
              axisLine={false}
            />
            <YAxis
              stroke={TEXT_MUTED}
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `£${v.toFixed(0)}`}
              domain={[0, "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />

            <Legend
              content={() => (
                <div className="flex items-center justify-center gap-5 pb-1 pt-2">
                  <div className="flex items-center gap-1.5">
                    <div style={{ height: "2px", width: "16px", backgroundColor: MEDIAN_COLOR }} />
                    <span style={{ fontSize: "10px", color: TEXT_MUTED }}>Most common price</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div style={{ height: "8px", width: "16px", borderRadius: "2px", backgroundColor: `${BAND_COLOR}22`, border: `1px dashed ${BAND_COLOR}` }} />
                    <span style={{ fontSize: "10px", color: TEXT_MUTED }}>Typical range</span>
                  </div>
                </div>
              )}
            />

            <defs>
              <linearGradient id="p25p75Grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={BAND_COLOR} stopOpacity={0.15} />
                <stop offset="100%" stopColor={BAND_COLOR} stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="p75"
              stroke="none"
              fill="url(#p25p75Grad)"
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="p25"
              stroke="none"
              fill={BG_SURFACE}
              fillOpacity={1}
            />
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
            <Line
              type="monotone"
              dataKey="median"
              stroke={MEDIAN_COLOR}
              strokeWidth={2}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              dot={(props: any) => {
                const { cx, cy, payload } = props;
                const isHighlighted =
                  highlightedDate && payload?.date
                    ? getISOWeekKey(highlightedDate) === getISOWeekKey(payload.date)
                    : false;
                return isHighlighted ? (
                  <circle key={payload.date} cx={cx} cy={cy} r={7} fill={MEDIAN_COLOR} stroke="#A98749" strokeWidth={2} />
                ) : (
                  <circle key={payload.date} cx={cx} cy={cy} r={3} fill={MEDIAN_COLOR} strokeWidth={0} />
                );
              }}
              activeDot={{ fill: MEDIAN_COLOR, strokeWidth: 2, stroke: "#A98749", r: 5 }}
              name="median"
              legendType="line"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between border-t border-border/30 pt-3 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted">eBay UK sold prices</span>
          <span className="text-[10px] text-muted/60">
            Verified completed listings only. Excludes unrelated species, multipacks and outliers.
          </span>
        </div>
        <span className="text-muted">{totalSamples} sales</span>
      </div>
    </div>
  );
}
