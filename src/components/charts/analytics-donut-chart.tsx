/**
 * Generic donut chart primitive — a recharts PieChart with an inner radius,
 * themed tooltip, and an optional legend. Slice colors come from the caller
 * (per-slice `fill`) or cycle through the `--color-chart-N` theme vars.
 * Intentionally flat: no data fetching, no i18n — same contract style as
 * `analytics-bar-chart` / `analytics-line-chart`.
 */

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "../../utils/cn";

/** Cycle through the 5 chart palette CSS vars for series/slice index `i`. */
export function chartSeriesVar(index: number): string {
  return `var(--color-chart-${(((index % 5) + 5) % 5) + 1})`;
}

export interface DonutSlice {
  label: string;
  value: number;
  /** Explicit slice fill (CSS var string); defaults to the chart palette cycle. */
  fill?: string;
}

export interface AnalyticsDonutChartProps {
  data: DonutSlice[];
  /** Accessible figcaption title. */
  title: string;
  /** Format a value for the tooltip (e.g. counts vs durations vs percents). */
  valueFormatter?: (value: number) => string;
  /** Show the slice legend (default true). */
  showLegend?: boolean;
  className?: string;
}

export function AnalyticsDonutChart({
  data,
  title,
  valueFormatter,
  showLegend = true,
  className,
}: AnalyticsDonutChartProps) {
  return (
    <figure className={cn("flex h-full min-h-[220px] w-full flex-col", className)}>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="min-h-0 flex-1" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              // recharts v3 leaves animated <path> series (Pie sectors, Line curves)
              // unpainted until a reflow; a static render commits the sectors on first paint.
              isAnimationActive={false}
            >
              {data.map((slice, i) => (
                <Cell key={`${slice.label}-${i}`} fill={slice.fill ?? chartSeriesVar(i)} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-foreground)",
              }}
              formatter={(v) => (valueFormatter ? valueFormatter(Number(v)) : v)}
            />
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
