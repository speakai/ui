/**
 * Stat-cards widget body (presentational) — a configurable set of usage totals.
 *
 * The host computes the `StatMetricValues` bag (and optional deltas) from its
 * own data sources and passes them in; this component only renders. Which cards
 * show (and their order) come from `config.metrics`; labels for each metric are
 * injected via `labels.metricLabels`. Cards listed in `config.unavailableKeys`
 * render an em-dash placeholder (e.g. account-wide metrics on the public view).
 */

import { StatCard, StatCardGrid } from "../StatCard";
import { Skeleton } from "../Skeleton";
import { WidgetError, DeltaCaption } from "./widget-states";
import {
  STAT_METRICS,
  resolveStatMetrics,
  type StatMetricKey,
  type StatMetricValues,
  type StatMetricDeltas,
} from "./stat-metrics";
import type { WidgetCommonLabels } from "./types";

export interface StatCardsConfig {
  /** Ordered list of metric keys to render; falls back to the default four. */
  metrics?: unknown;
  /** Show the period-over-period delta caption under snapshot-backed cards. */
  showDelta?: boolean;
  /** Metric keys to render as an em-dash placeholder (e.g. public-unavailable). */
  unavailableKeys?: StatMetricKey[];
}

export interface StatCardsLabels extends WidgetCommonLabels {
  /** Display label per metric key (the host localises these). */
  metricLabels: Record<StatMetricKey, string>;
  /** Placeholder shown for an unavailable card's value. Defaults to "—". */
  unavailableValue?: string;
  /** Tooltip on an unavailable card. */
  unavailableTitle?: string;
  /** Caption when a delta is zero/absent. */
  noChangeLabel?: string;
  /** Build the delta caption text, e.g. `(sign, value) => "+1.2K vs previous"`. */
  deltaLabel?: (sign: string, value: string) => string;
}

export interface StatCardsWidgetProps {
  data: StatMetricValues | undefined;
  deltas?: StatMetricDeltas;
  isLoading: boolean;
  isError: boolean;
  config?: StatCardsConfig;
  labels: StatCardsLabels;
  onRetry?: () => void;
}

/** StatCardGrid only supports 2–4 columns; clamp the card count into that. */
function gridColumns(count: number): 2 | 3 | 4 {
  if (count <= 2) return 2;
  if (count === 3) return 3;
  return 4;
}

export function StatCardsWidget({
  data,
  deltas,
  isLoading,
  isError,
  config,
  labels,
  onRetry,
}: StatCardsWidgetProps) {
  const selected: StatMetricKey[] = resolveStatMetrics(config?.metrics);
  const columns = gridColumns(selected.length);
  const unavailable = new Set(config?.unavailableKeys ?? []);

  if (isLoading) {
    return (
      <StatCardGrid columns={columns} className="h-full content-start">
        {selected.map((key) => (
          <Skeleton key={key} className="h-24 w-full rounded-xl" />
        ))}
      </StatCardGrid>
    );
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  const values: StatMetricValues = data ?? {
    totalMedia: 0,
    storageBytes: 0,
    totalPrompts: 0,
    usedMinutes: 0,
    totalWords: 0,
    uniqueSpeakers: 0,
    totalDurationSeconds: 0,
    avgSentiment: null,
  };

  const resolvedDeltas: StatMetricDeltas = deltas ?? {
    totalWordsDelta: null,
    uniqueSpeakersDelta: null,
    totalDurationSecondsDelta: null,
  };

  return (
    <StatCardGrid columns={columns} className="h-full content-start">
      {selected.map((key) => {
        const meta = STAT_METRICS[key];
        const Icon = meta.icon;
        const showDelta = !!config?.showDelta && !!meta.getDelta;
        const isUnavailable = unavailable.has(key);
        const card = (
          <StatCard
            key={key}
            icon={<Icon className="h-5 w-5" />}
            iconColor={meta.iconColor}
            label={labels.metricLabels[key]}
            value={
              isUnavailable
                ? labels.unavailableValue ?? "—"
                : meta.getValue(values)
            }
            valueClassName={isUnavailable ? "text-muted-foreground" : undefined}
            title={isUnavailable ? labels.unavailableTitle : undefined}
          />
        );
        if (!showDelta) return card;
        return (
          <div key={key} className="flex flex-col">
            {card}
            <DeltaCaption
              className="mt-1"
              delta={meta.getDelta!(resolvedDeltas)}
              format={meta.formatDelta ?? ((n) => `${n}`)}
              noChangeLabel={labels.noChangeLabel ?? ""}
              deltaLabel={
                labels.deltaLabel ?? ((sign, value) => `${sign}${value}`)
              }
            />
          </div>
        );
      })}
    </StatCardGrid>
  );
}
