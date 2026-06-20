/**
 * Comparison widget body (presentational) — a compact period-over-period readout:
 * each selected metric shows its current value and the change vs the previous
 * equal-length period (▲/▼, coloured). Data is the shared `PublicInsightSnapshotData`.
 *
 * `config.metrics` selects which to show (shared delta metrics plus the
 * comparison-only `sentiment` extra, which has a value but no delta). Metric and
 * sentiment labels are injected.
 */

import type { PublicInsightSnapshotData } from "@speakai/shared";
import { cn } from "../../utils/cn";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { TrendingUpIcon, TrendingDownIcon, BarChart3Icon } from "./icons";
import {
  SNAPSHOT_METRICS,
  resolveComparisonMetrics,
  type SnapshotMetricKey,
} from "./snapshot-metrics";
import type { WidgetCommonLabels } from "./types";

export interface ComparisonConfig {
  metrics?: unknown;
  /** Show the change column. */
  showDelta?: boolean;
}

export interface ComparisonLabels extends WidgetCommonLabels {
  /** Display label per delta-metric key. */
  metricLabels: Record<SnapshotMetricKey, string>;
  /** Label for the sentiment row. */
  sentimentLabel: string;
  /** Display label per dominant-sentiment key (positive/neutral/negative). */
  sentimentValueLabels: Record<string, string>;
  /** Shown when sentiment is unscored. */
  sentimentNoneLabel: string;
  /** Shown in the change column when a delta is zero/absent. Defaults to "—". */
  noChangeLabel?: string;
  /** Build the change text, e.g. `(sign, value) => "+1.2K"`. */
  deltaLabel?: (sign: string, value: string) => string;
  emptyTitle: string;
  emptyDescription?: string;
}

export interface ComparisonWidgetProps {
  data: PublicInsightSnapshotData | undefined;
  isLoading: boolean;
  isError: boolean;
  config?: ComparisonConfig;
  labels: ComparisonLabels;
  onRetry?: () => void;
}

/** The dominant sentiment label for the current period, or null if unscored. */
function dominantSentiment(
  data: PublicInsightSnapshotData,
): { key: string; value: number } | null {
  const s = data.current.sentiment;
  if (!s) return null;
  const entries: { key: string; value: number }[] = [
    { key: "positive", value: s.positive },
    { key: "neutral", value: s.neutral },
    { key: "negative", value: s.negative },
  ];
  const top = entries.reduce((a, b) => (b.value > a.value ? b : a));
  return top.value > 0 ? top : null;
}

function MetricRow({
  label,
  value,
  delta,
  formatDelta,
  showDelta,
  noChangeLabel,
  deltaLabel,
}: {
  label: string;
  value: string;
  delta: number | null;
  formatDelta: (n: number) => string;
  showDelta: boolean;
  noChangeLabel: string;
  deltaLabel: (sign: string, value: string) => string;
}) {
  const positive = (delta ?? 0) > 0;
  const Icon = positive ? TrendingUpIcon : TrendingDownIcon;

  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-border py-2 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-semibold text-foreground">{value}</p>
      </div>
      {!showDelta ? null : delta == null || delta === 0 ? (
        <span className="shrink-0 text-xs text-muted-foreground">{noChangeLabel}</span>
      ) : (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 text-xs font-medium",
            positive ? "text-success" : "text-destructive",
          )}
        >
          <Icon className="h-3.5 w-3.5" />
          {deltaLabel(positive ? "+" : "−", formatDelta(Math.abs(delta)))}
        </span>
      )}
    </div>
  );
}

export function ComparisonWidget({
  data,
  isLoading,
  isError,
  config,
  labels,
  onRetry,
}: ComparisonWidgetProps) {
  const showDelta = !!config?.showDelta;
  const selected = resolveComparisonMetrics(config?.metrics);
  const noChangeLabel = labels.noChangeLabel ?? "—";
  const deltaLabel = labels.deltaLabel ?? ((sign, value) => `${sign}${value}`);

  if (isLoading) {
    return <div className="h-40 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  if (!data) {
    return (
      <WidgetEmpty
        icon={<BarChart3Icon className="h-10 w-10" />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  const sentiment = dominantSentiment(data);

  return (
    <div className="flex flex-col">
      {selected.map((metric) => {
        if (metric === "sentiment") {
          return (
            <MetricRow
              key="sentiment"
              label={labels.sentimentLabel}
              value={
                sentiment
                  ? labels.sentimentValueLabels[sentiment.key] ?? sentiment.key
                  : labels.sentimentNoneLabel
              }
              delta={null}
              formatDelta={(n) => `${n}`}
              showDelta={showDelta}
              noChangeLabel={noChangeLabel}
              deltaLabel={deltaLabel}
            />
          );
        }

        const meta = SNAPSHOT_METRICS[metric];
        const current = meta.getCurrent(data.current);
        const delta = meta.getDelta(data.delta);

        return (
          <MetricRow
            key={metric}
            label={labels.metricLabels[metric]}
            value={meta.format(current)}
            delta={delta}
            formatDelta={meta.format}
            showDelta={showDelta}
            noChangeLabel={noChangeLabel}
            deltaLabel={deltaLabel}
          />
        );
      })}
    </div>
  );
}
