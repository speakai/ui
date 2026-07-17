import { useCallback, useRef, type RefObject } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "../../utils/cn";
import { useReducedMotion } from "./use-reduced-motion";
import { useContainerWidth } from "./use-container-width";
import { chartSeriesVar } from "./analytics-donut-chart";
import { computeCategoryAxis, CategoryAxisTick } from "./category-axis";
import type { ChartInsight } from "./chart-types";

interface AnalyticsBarChartProps {
  data: ChartInsight[];
  compareData?: ChartInsight[];
  title: string;
  chartLabel?: string;
  compareLabel?: string;
  maxBars?: number;
  tickMaxLength?: number;
  onBarClick?: (text: string) => void;
  containerRef?: RefObject<HTMLDivElement | null>;
  className?: string;
  /** Format a value for the Y-axis ticks and tooltip (e.g. "1,004h 4m"). */
  valueFormatter?: (value: number) => string;
  /** Allow fractional Y-axis ticks (default false — counts are integers). */
  allowDecimals?: boolean;
  /**
   * Color each bar by cycling the 5-color chart palette (categorical data —
   * distinct categories read as distinct colors). Single-series only: ignored
   * when `compareData` is present. Default false — all bars use chart-1.
   */
  categoricalPalette?: boolean;
}

export function AnalyticsBarChart({
  data,
  compareData,
  title,
  chartLabel,
  compareLabel,
  maxBars = 25,
  tickMaxLength,
  onBarClick,
  containerRef: externalRef,
  className,
  valueFormatter,
  allowDecimals,
  categoricalPalette = false,
}: AnalyticsBarChartProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const chartRef = externalRef ?? internalRef;

  const containerWidth = useContainerWidth(chartRef);
  const isMobile = containerWidth < 400;
  const reducedMotion = useReducedMotion();

  const chartData = (() => {
    if (!compareData || compareData.length === 0) {
      return data
        .slice(0, maxBars)
        .map((d) => ({ text: d.text, nTimes: d.nTimes }));
    }
    const merged = new Map<string, { nTimes: number; compareNTimes: number }>();
    for (const d of data) {
      merged.set(d.text, { nTimes: d.nTimes, compareNTimes: 0 });
    }
    for (const d of compareData) {
      const existing = merged.get(d.text);
      if (existing) {
        existing.compareNTimes = d.nTimes;
      } else {
        merged.set(d.text, { nTimes: 0, compareNTimes: d.nTimes });
      }
    }
    return Array.from(merged.entries())
      .slice(0, maxBars)
      .map(([text, vals]) => ({ text, ...vals }));
  })();

  const colorByCategory =
    categoricalPalette && (!compareData || compareData.length === 0);

  const axisLayout = computeCategoryAxis(
    chartData.length,
    containerWidth,
    isMobile,
    tickMaxLength,
  );

  const handleBarClick = useCallback(
    (entry: { payload?: { text?: string } }, _index: number) => {
      if (onBarClick && entry.payload?.text) {
        onBarClick(entry.payload.text);
      }
    },
    [onBarClick],
  );

  return (
    <figure className={cn("flex h-full min-h-[220px] w-full flex-col", className)}>
      <figcaption className="sr-only">{title}</figcaption>
      <div ref={chartRef as RefObject<HTMLDivElement>} className="min-h-0 flex-1" aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: isMobile ? 8 : 20,
              left: 0,
              bottom: 5,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="text"
              stroke="var(--color-muted-foreground)"
              interval={axisLayout.interval}
              height={axisLayout.height}
              tickMargin={8}
              tick={
                <CategoryAxisTick
                  angle={axisLayout.angle}
                  textAnchor={axisLayout.textAnchor}
                  maxCharsPerLine={axisLayout.maxCharsPerLine}
                  maxLines={axisLayout.maxLines}
                  fill="var(--color-muted-foreground)"
                  fontSize={isMobile ? 10 : 12}
                />
              }
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: isMobile ? 10 : 12,
              }}
              width={isMobile ? 28 : 40}
              allowDecimals={allowDecimals ?? false}
              tickFormatter={
                valueFormatter
                  ? (v: number) => valueFormatter(Number(v))
                  : undefined
              }
            />
            <Tooltip
              cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
              contentStyle={{
                backgroundColor: "var(--color-popover)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgb(0 0 0 / 0.12)",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "var(--color-muted-foreground)", fontSize: 12, fontWeight: 500, marginBottom: 4 }}
              itemStyle={{ color: "var(--color-popover-foreground)", fontSize: 13, padding: 0 }}
              formatter={(v) => (valueFormatter ? valueFormatter(Number(v)) : v)}
            />
            {compareData && <Legend />}
            <Bar
              dataKey="nTimes"
              name={chartLabel || "Count"}
              fill="var(--color-chart-1)"
              radius={[4, 4, 0, 0]}
              cursor={onBarClick ? "pointer" : undefined}
              onClick={handleBarClick}
              activeBar={{ fillOpacity: 0.8 }}
              isAnimationActive={!reducedMotion}
            >
              {colorByCategory &&
                chartData.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={chartSeriesVar(i)} />
                ))}
            </Bar>
            {compareData && (
              <Bar
                dataKey="compareNTimes"
                name={compareLabel || "Compare"}
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!reducedMotion}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
