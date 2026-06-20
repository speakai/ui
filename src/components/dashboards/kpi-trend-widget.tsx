/**
 * KPI-trend widget body (presentational) — one or more headline metrics, each a
 * `StatCard` plus a coloured period-over-period delta caption. Data is the shared
 * `PublicInsightSnapshotData`.
 *
 * Which metrics show (and order) come from `config.metrics` (modern) or the
 * legacy single `config.metric`. Metric labels are injected via `labels.metricLabels`.
 */

import type { PublicInsightSnapshotData } from "@speakai/shared";
import { StatCard } from "../StatCard";
import { WidgetError, WidgetEmpty, DeltaCaption } from "./widget-states";
import { TrendingUpIcon } from "./icons";
import {
  SNAPSHOT_METRICS,
  resolveKpiMetrics,
  resolveSnapshotMetrics,
  type SnapshotMetricKey,
} from "./snapshot-metrics";
import type { WidgetCommonLabels } from "./types";

export interface KpiTrendConfig {
  /** Modern config: ordered list of delta-metric keys. */
  metrics?: unknown;
  /** Legacy config: a single delta-metric key (back-compat). */
  metric?: string;
  /** Show the period-over-period delta caption. */
  showDelta?: boolean;
}

export interface KpiTrendLabels extends WidgetCommonLabels {
  /** Widget title — used as the single card's label in the legacy single case. */
  title: string;
  /** Display label per metric key (the host localises these). */
  metricLabels: Record<SnapshotMetricKey, string>;
  emptyTitle: string;
  emptyDescription?: string;
  noChangeLabel?: string;
  deltaLabel?: (sign: string, value: string) => string;
}

export interface KpiTrendWidgetProps {
  data: PublicInsightSnapshotData | undefined;
  isLoading: boolean;
  isError: boolean;
  config?: KpiTrendConfig;
  labels: KpiTrendLabels;
  onRetry?: () => void;
}

function KpiMetricCard({
  metricKey,
  data,
  label,
  showDelta,
  noChangeLabel,
  deltaLabel,
}: {
  metricKey: SnapshotMetricKey;
  data: PublicInsightSnapshotData;
  label: string;
  showDelta: boolean;
  noChangeLabel: string;
  deltaLabel: (sign: string, value: string) => string;
}) {
  const meta = SNAPSHOT_METRICS[metricKey];
  const Icon = meta.icon;
  const value = meta.getCurrent(data.current);
  const delta = meta.getDelta(data.delta);

  return (
    <div className="space-y-2">
      <StatCard
        icon={<Icon className="h-5 w-5" />}
        iconColor="blue"
        label={label}
        value={meta.format(value)}
      />
      {showDelta ? (
        <DeltaCaption
          delta={delta}
          format={meta.format}
          noChangeLabel={noChangeLabel}
          deltaLabel={deltaLabel}
        />
      ) : null}
    </div>
  );
}

export function KpiTrendWidget({
  data,
  isLoading,
  isError,
  config,
  labels,
  onRetry,
}: KpiTrendWidgetProps) {
  const showDelta = !!config?.showDelta;
  const selected = resolveKpiMetrics(config?.metrics, config?.metric);
  const isLegacySingle =
    !Array.isArray(config?.metrics) ||
    resolveSnapshotMetrics(config?.metrics).length === 0;
  const noChangeLabel = labels.noChangeLabel ?? "";
  const deltaLabel = labels.deltaLabel ?? ((sign, value) => `${sign}${value}`);

  if (isLoading) {
    return <div className="h-28 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  if (!data) {
    return (
      <WidgetEmpty
        icon={<TrendingUpIcon className="h-10 w-10" />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  if (selected.length === 1 && isLegacySingle) {
    return (
      <KpiMetricCard
        metricKey={selected[0]}
        data={data}
        label={labels.title}
        showDelta={showDelta}
        noChangeLabel={noChangeLabel}
        deltaLabel={deltaLabel}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {selected.map((key) => (
        <KpiMetricCard
          key={key}
          metricKey={key}
          data={data}
          label={labels.metricLabels[key]}
          showDelta={showDelta}
          noChangeLabel={noChangeLabel}
          deltaLabel={deltaLabel}
        />
      ))}
    </div>
  );
}
