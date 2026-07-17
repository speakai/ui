/**
 * Metric-chart widget body (presentational) — renders a spec-driven metric as a
 * line / bar / area / donut / stacked-bar chart. Data arrives as flat
 * `MetricChartData` rows (`group` × optional `series` × `value`); the widget
 * pivots them into one recharts series per distinct `series` value.
 *
 * Thresholds (single-series bar and donut only) color each mark by
 * `resolveThresholdStatus`; line/area ignore thresholds. All user-facing
 * strings are injected via `labels`.
 */

import { useRef, type CSSProperties, type ReactElement } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
import { useReducedMotion } from "../charts/use-reduced-motion";
import { useContainerWidth } from "../charts/use-container-width";
import { AnalyticsDonutChart, chartSeriesVar } from "../charts/analytics-donut-chart";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { BarChart3Icon } from "./icons";
import { resolveThresholdStatus, thresholdFillVar, type SpecThreshold } from "./spec-thresholds";
import { formatCount, formatDurationHuman } from "./format";

// ── Data contract ────────────────────────────────────────────────────────────

export interface MetricChartDatum {
  group: string;
  series?: string | null;
  value: number | null;
}

export interface MetricChartData {
  rows: MetricChartDatum[];
  valueFormat?: "number" | "duration";
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface MetricChartWidgetConfig {
  mark: "line" | "bar" | "area" | "donut" | "stacked-bar";
  thresholds?: SpecThreshold[];
}

export interface MetricChartWidgetLabels {
  title: string;
  empty: string;
  emptyDescription?: string;
  error: string;
  retry?: string;
}

export interface MetricChartWidgetProps {
  data?: MetricChartData;
  isLoading: boolean;
  isError: boolean;
  config: MetricChartWidgetConfig;
  labels: MetricChartWidgetLabels;
  onRetry?: () => void;
}

// ── Pivot helpers ────────────────────────────────────────────────────────────

interface Pivoted {
  /** Distinct series keys in insertion order ("" = the unnamed series). */
  seriesKeys: string[];
  /** One record per group: `{ group, s0: value, s1: value, ... }`. */
  rows: Array<Record<string, string | number | null>>;
}

/**
 * Pivot flat rows into recharts shape: one record per `group`, one data key
 * (`s0`, `s1`, …) per distinct series value in insertion order. Rows with a
 * null/undefined series share the unnamed "" series. Duplicate (group, series)
 * pairs sum their non-null values.
 */
function pivotRows(rows: MetricChartDatum[]): Pivoted {
  const seriesKeys: string[] = [];
  const groups: string[] = [];
  const cells = new Map<string, number | null>();

  for (const row of rows) {
    const series = row.series ?? "";
    if (!seriesKeys.includes(series)) seriesKeys.push(series);
    if (!groups.includes(row.group)) groups.push(row.group);
    const cellKey = `${row.group}\u0000${series}`;
    const existing = cells.get(cellKey);
    if (row.value == null) {
      if (!cells.has(cellKey)) cells.set(cellKey, null);
    } else {
      cells.set(cellKey, (existing ?? 0) + row.value);
    }
  }

  const pivoted = groups.map((group) => {
    const record: Record<string, string | number | null> = { group };
    seriesKeys.forEach((series, i) => {
      const cell = cells.get(`${group}\u0000${series}`);
      record[`s${i}`] = cell === undefined ? null : cell;
    });
    return record;
  });

  return { seriesKeys, rows: pivoted };
}

/** Sum non-null values per group (donut aggregation — series collapsed). */
function sumByGroup(rows: MetricChartDatum[]): Array<{ group: string; total: number }> {
  const totals = new Map<string, number>();
  for (const row of rows) {
    totals.set(row.group, (totals.get(row.group) ?? 0) + (row.value ?? 0));
  }
  return Array.from(totals.entries()).map(([group, total]) => ({ group, total }));
}

// ── Component ────────────────────────────────────────────────────────────────

const AXIS_TICK = { fill: "var(--color-muted-foreground)", fontSize: 12 };

/** Ellipsis-truncate x-axis category labels past this length (matches AnalyticsBarChart's field-distribution ticks). */
const X_TICK_MAX_LENGTH = 16;

// Card-style tooltip on the floating `--color-popover` surface (not the page
// `--color-background`), with a subtle shadow so it reads as a lifted card in
// both themes. Paired with a low-opacity `cursor` fill below, which replaces
// recharts' default opaque grey column overlay.
const TOOLTIP_CONTENT_STYLE: CSSProperties = {
  backgroundColor: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgb(0 0 0 / 0.12)",
  padding: "8px 12px",
};
const TOOLTIP_LABEL_STYLE: CSSProperties = {
  color: "var(--color-muted-foreground)",
  fontSize: 12,
  fontWeight: 500,
  marginBottom: 4,
};
const TOOLTIP_ITEM_STYLE: CSSProperties = {
  color: "var(--color-popover-foreground)",
  fontSize: 13,
  padding: 0,
};

export function MetricChartWidget({
  data,
  isLoading,
  isError,
  config,
  labels,
  onRetry,
}: MetricChartWidgetProps) {
  const reducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);
  const isMobile = containerWidth < 400;

  if (isLoading) {
    return <div className="h-80 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return (
      <WidgetError
        labels={{ errorTitle: labels.error, retryLabel: labels.retry }}
        onRetry={onRetry}
      />
    );
  }

  const rows = data?.rows ?? [];
  if (rows.length === 0) {
    return (
      <WidgetEmpty
        icon={<BarChart3Icon className="h-10 w-10" />}
        title={labels.empty}
        description={labels.emptyDescription}
      />
    );
  }

  const formatValue =
    data?.valueFormat === "duration"
      ? (v: number) => formatDurationHuman(v)
      : formatCount;

  const { thresholds } = config;

  if (config.mark === "donut") {
    const slices = sumByGroup(rows).map(({ group, total }, i) => {
      const match = resolveThresholdStatus(total, thresholds);
      return {
        label: group,
        value: total,
        fill: match ? thresholdFillVar(match.status) : chartSeriesVar(i),
      };
    });
    return (
      <AnalyticsDonutChart data={slices} title={labels.title} valueFormatter={formatValue} />
    );
  }

  const { seriesKeys, rows: chartData } = pivotRows(rows);
  const multiSeries = seriesKeys.length > 1;
  const seriesName = (key: string, i: number) => (key === "" ? labels.title : key) || `s${i}`;

  const axes = (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
      <XAxis
        dataKey="group"
        stroke="var(--color-muted-foreground)"
        tick={AXIS_TICK}
        angle={-45}
        textAnchor="end"
        interval={isMobile ? Math.max(1, Math.ceil(chartData.length / 6) - 1) : 0}
        height={isMobile ? 50 : 80}
        tickFormatter={(v: string) =>
          v?.length > X_TICK_MAX_LENGTH ? v.slice(0, X_TICK_MAX_LENGTH) + "…" : (v ?? "")
        }
      />
      <YAxis
        stroke="var(--color-muted-foreground)"
        tick={AXIS_TICK}
        width={48}
        allowDecimals={false}
        tickFormatter={(v: number) => formatValue(Number(v))}
      />
      <Tooltip
        cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
        contentStyle={TOOLTIP_CONTENT_STYLE}
        labelStyle={TOOLTIP_LABEL_STYLE}
        itemStyle={TOOLTIP_ITEM_STYLE}
        formatter={(v) => formatValue(Number(v))}
      />
      {multiSeries && <Legend />}
    </>
  );

  let chart: ReactElement;

  if (config.mark === "line") {
    chart = (
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        {axes}
        {seriesKeys.map((key, i) => (
          <Line
            key={key || "__default"}
            type="monotone"
            dataKey={`s${i}`}
            name={seriesName(key, i)}
            stroke={chartSeriesVar(i)}
            strokeWidth={2}
            dot={{ fill: chartSeriesVar(i), r: 3 }}
            activeDot={{ r: 5 }}
            // recharts v3 leaves animated <path> series (Line curves, Pie sectors)
            // unpainted until a reflow; a static render draws the line on first paint.
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    );
  } else if (config.mark === "area") {
    chart = (
      <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        {axes}
        {seriesKeys.map((key, i) => (
          <Area
            key={key || "__default"}
            type="monotone"
            dataKey={`s${i}`}
            name={seriesName(key, i)}
            stroke={chartSeriesVar(i)}
            fill={chartSeriesVar(i)}
            fillOpacity={0.25}
            strokeWidth={2}
            // Same recharts v3 path-paint bug as Line — render the area statically.
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    );
  } else {
    const stacked = config.mark === "stacked-bar";
    const colorByThreshold = !stacked && seriesKeys.length === 1 && !!thresholds?.length;
    chart = (
      <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
        {axes}
        {seriesKeys.map((key, i) => (
          <Bar
            key={key || "__default"}
            dataKey={`s${i}`}
            name={seriesName(key, i)}
            stackId={stacked ? "stack" : undefined}
            fill={chartSeriesVar(i)}
            radius={stacked ? undefined : [4, 4, 0, 0]}
            isAnimationActive={!reducedMotion}
          >
            {colorByThreshold &&
              chartData.map((record, j) => {
                const value = record.s0;
                const match =
                  typeof value === "number"
                    ? resolveThresholdStatus(value, thresholds)
                    : null;
                return (
                  <Cell
                    key={`cell-${j}`}
                    fill={match ? thresholdFillVar(match.status) : chartSeriesVar(0)}
                  />
                );
              })}
          </Bar>
        ))}
      </BarChart>
    );
  }

  return (
    <figure className="w-full">
      <figcaption className="sr-only">{labels.title}</figcaption>
      <div ref={containerRef} aria-hidden="true">
        <ResponsiveContainer width="100%" height={300}>
          {chart}
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
