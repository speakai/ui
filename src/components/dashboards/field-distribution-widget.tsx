/**
 * Field-distribution widget body (presentational) — value frequency for a single
 * custom field, as a bar chart. Data is the shared `PublicFieldDistributionData`.
 */

import type { PublicFieldDistributionData } from "@speakai/shared";
import { AnalyticsBarChart } from "../charts/analytics-bar-chart";
import type { ChartInsight } from "../charts/chart-types";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { TagsIcon } from "./icons";
import type { WidgetCommonLabels } from "./types";
import { formatCount, formatDurationHuman } from "./format";

export interface FieldDistributionLabels extends WidgetCommonLabels {
  /** Chart accessible/figcaption title. */
  title: string;
  emptyTitle: string;
  emptyDescription?: string;
  /** Bar series label, e.g. "Media" / "Words" / "Duration". */
  measureLabel?: string;
}

export interface FieldDistributionWidgetProps {
  data: PublicFieldDistributionData | undefined;
  isLoading: boolean;
  isError: boolean;
  labels: FieldDistributionLabels;
  onRetry?: () => void;
  /**
   * Render-only config. `measure` selects what `nTimes` represents:
   * "count" (default) | "words" | "duration" | "avg:<fieldId>" | "sum:<fieldId>".
   * It drives value formatting only — the server has already projected the chosen
   * measure into `nTimes`.
   */
  config?: { measure?: string };
}

export function FieldDistributionWidget({
  data,
  isLoading,
  isError,
  labels,
  onRetry,
  config,
}: FieldDistributionWidgetProps) {
  if (isLoading) {
    return <div className="h-80 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  const insights: ChartInsight[] = data?.insights ?? [];

  if (insights.length === 0) {
    return (
      <WidgetEmpty
        icon={<TagsIcon className="h-10 w-10" />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  const measure = config?.measure ?? "count";
  const isAverage = measure.startsWith("avg:");
  const isSum = measure.startsWith("sum:");
  // Averages of a numeric field can be fractional (e.g. 54.3) — show up to one
  // decimal. Sums reuse the grouped count formatter; duration stays human-readable.
  const valueFormatter = isAverage
    ? (v: number) =>
        Number.isFinite(v)
          ? v.toLocaleString("en-US", { maximumFractionDigits: 1 })
          : String(v)
    : measure === "duration"
      ? formatDurationHuman
      : formatCount;

  return (
    <AnalyticsBarChart
      data={insights}
      title={labels.title}
      tickMaxLength={16}
      chartLabel={labels.measureLabel}
      valueFormatter={valueFormatter}
      allowDecimals={measure !== "count" && !isSum}
    />
  );
}
