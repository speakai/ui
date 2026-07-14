/**
 * Field-distribution widget body (presentational) — value frequency for a single
 * custom field, as a bar chart (default) or donut. Data is the shared
 * `PublicFieldDistributionData`.
 */

import type { PublicFieldDistributionData } from "@speakai/shared";
import { AnalyticsBarChart } from "../charts/analytics-bar-chart";
import { AnalyticsDonutChart } from "../charts/analytics-donut-chart";
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

export interface FieldDistributionConfig {
  /**
   * Selects what `nTimes` represents: "count" (default) | "words" | "duration"
   * | "avg:<fieldId>" | "sum:<fieldId>" drive value formatting only — the
   * server has already projected the chosen measure into `nTimes`. "percent"
   * additionally converts counts to percentages of the total client-side.
   */
  measure?: string;
  /** Chart rendering: grouped bars (default) or a donut. */
  chartType?: "bar" | "donut";
}

export interface FieldDistributionWidgetProps {
  data: PublicFieldDistributionData | undefined;
  isLoading: boolean;
  isError: boolean;
  labels: FieldDistributionLabels;
  onRetry?: () => void;
  config?: FieldDistributionConfig;
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

  let insights: ChartInsight[] = data?.insights ?? [];

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
  const isPercent = measure === "percent";

  if (isPercent) {
    const total = insights.reduce((sum, d) => sum + d.nTimes, 0);
    insights = insights.map((d) => ({
      text: d.text,
      nTimes: total > 0 ? Number(((d.nTimes / total) * 100).toFixed(1)) : 0,
    }));
  }

  // Averages of a numeric field can be fractional (e.g. 54.3) — show up to one
  // decimal. Sums reuse the grouped count formatter; duration stays human-readable.
  const valueFormatter = isPercent
    ? (v: number) => `${v.toFixed(1)}%`
    : isAverage
      ? (v: number) =>
          Number.isFinite(v)
            ? v.toLocaleString("en-US", { maximumFractionDigits: 1 })
            : String(v)
      : measure === "duration"
        ? formatDurationHuman
        : formatCount;

  if (config?.chartType === "donut") {
    return (
      <AnalyticsDonutChart
        data={insights.map((d) => ({ label: d.text, value: d.nTimes }))}
        title={labels.title}
        valueFormatter={valueFormatter}
      />
    );
  }

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
