/**
 * Comparison widget body (presentational) — a side-by-side A/B readout. The
 * host resolves the two segments and their metrics into `ComparisonWidgetData`;
 * this renders one row per metric with value A, value B, and a coloured ▲/▼
 * delta indicator (B relative to A). All user-facing strings are injected.
 */

import { cn } from "../../utils/cn";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { TrendingUpIcon, TrendingDownIcon, BarChart3Icon } from "./icons";
import { formatCount, formatDurationHuman } from "./format";

// ── Data contract ────────────────────────────────────────────────────────────

export interface ComparisonMetricRow {
  label: string;
  a: number | null;
  b: number | null;
  /** How to render the values + delta; defaults to a plain count. */
  valueFormat?: "number" | "duration";
}

export interface ComparisonWidgetData {
  aLabel: string;
  bLabel: string;
  metrics: ComparisonMetricRow[];
}

// ── Props ────────────────────────────────────────────────────────────────────

export interface ComparisonWidgetLabels {
  title: string;
  empty: string;
  error: string;
  retry?: string;
}

export interface ComparisonWidgetProps {
  data?: ComparisonWidgetData;
  isLoading: boolean;
  isError: boolean;
  labels: ComparisonWidgetLabels;
  onRetry?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

function formatMetric(
  value: number,
  format: ComparisonMetricRow["valueFormat"],
): string {
  return format === "duration" ? formatDurationHuman(value) : formatCount(value);
}

function formatValue(
  value: number | null,
  format: ComparisonMetricRow["valueFormat"],
): string {
  return value == null ? "—" : formatMetric(value, format);
}

function DeltaIndicator({
  a,
  b,
  valueFormat,
}: {
  a: number | null;
  b: number | null;
  valueFormat: ComparisonMetricRow["valueFormat"];
}) {
  if (a == null || b == null || a === b) {
    return <span className="shrink-0 text-xs text-muted-foreground">—</span>;
  }
  const delta = b - a;
  const positive = delta > 0;
  const Icon = positive ? TrendingUpIcon : TrendingDownIcon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-xs font-medium",
        positive ? "text-success" : "text-destructive",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {`${positive ? "+" : "−"}${formatMetric(Math.abs(delta), valueFormat)}`}
    </span>
  );
}

export function ComparisonWidget({
  data,
  isLoading,
  isError,
  labels,
  onRetry,
}: ComparisonWidgetProps) {
  if (isLoading) {
    return <div className="h-40 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return (
      <WidgetError
        labels={{ errorTitle: labels.error, retryLabel: labels.retry }}
        onRetry={onRetry}
      />
    );
  }

  if (!data || data.metrics.length === 0) {
    return (
      <WidgetEmpty icon={<BarChart3Icon className="h-10 w-10" />} title={labels.empty} />
    );
  }

  return (
    <div className="flex flex-col" role="table" aria-label={labels.title}>
      <div
        role="row"
        className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-4 border-b border-border py-2"
      >
        <span role="columnheader" className="sr-only">
          {labels.title}
        </span>
        <span
          role="columnheader"
          className="min-w-[64px] text-right text-xs font-medium text-muted-foreground"
        >
          {data.aLabel}
        </span>
        <span
          role="columnheader"
          className="min-w-[64px] text-right text-xs font-medium text-muted-foreground"
        >
          {data.bLabel}
        </span>
        <span role="columnheader" className="sr-only">
          Δ
        </span>
      </div>
      {data.metrics.map((metric, i) => (
        <div
          key={`${metric.label}-${i}`}
          role="row"
          className="grid grid-cols-[1fr_auto_auto_auto] items-baseline gap-x-4 border-b border-border py-2 last:border-b-0"
        >
          <span role="cell" className="truncate text-xs text-muted-foreground">
            {metric.label}
          </span>
          <span
            role="cell"
            className="min-w-[64px] text-right text-sm font-semibold text-foreground tabular-nums"
          >
            {formatValue(metric.a, metric.valueFormat)}
          </span>
          <span
            role="cell"
            className="min-w-[64px] text-right text-sm font-semibold text-foreground tabular-nums"
          >
            {formatValue(metric.b, metric.valueFormat)}
          </span>
          <span role="cell" className="text-right">
            <DeltaIndicator a={metric.a} b={metric.b} valueFormat={metric.valueFormat} />
          </span>
        </div>
      ))}
    </div>
  );
}
