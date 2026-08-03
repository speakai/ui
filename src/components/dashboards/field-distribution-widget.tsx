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
  /** Label for the prior-period series when a comparison is present. */
  compareLabel?: string;
}

export interface FieldDistributionConfig {
  /**
   * Selects what `nTimes` represents: "count" (default) | "words" | "duration"
   * | "avg:<fieldId>" | "sum:<fieldId>" drive value formatting only — the
   * server has already projected the chosen measure into `nTimes`. "percent"
   * additionally converts counts to percentages of the total client-side.
   */
  measure?: string;
  /** Rendering: grouped bars (default), a donut, or a comparison table. */
  chartType?: "bar" | "donut" | "table";
}

/**
 * Comparison table: one row per category with its value, share of total, and
 * the change vs the prior window. Preferred over paired bars when the reader
 * needs exact numbers and a delta rather than an eyeballed comparison.
 */
function FieldDistributionTable({
  rows,
  prev,
  valueFormatter,
  measureLabel,
}: {
  rows: ChartInsight[];
  prev: ChartInsight[];
  valueFormatter: (v: number) => string;
  measureLabel?: string;
}) {
  const total = rows.reduce((sum, d) => sum + d.nTimes, 0);
  const prevByText = new Map(prev.map((d) => [d.text, d.nTimes]));
  const hasPrev = prev.length > 0;
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <th className="py-2 pr-3 text-left">Category</th>
            <th className="py-2 px-3 text-right">{measureLabel ?? "Count"}</th>
            <th className="py-2 px-3 text-right">% of total</th>
            {hasPrev && <th className="py-2 pl-3 text-right">vs prev period</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((d) => {
            const pct = total > 0 ? Math.round((d.nTimes / total) * 100) : 0;
            const prevN = prevByText.get(d.text);
            const delta = prevN != null ? d.nTimes - prevN : null;
            const deltaPct =
              prevN != null && prevN > 0 ? Math.round(((d.nTimes - prevN) / prevN) * 100) : null;
            const arrow = delta == null || delta === 0 ? "" : delta > 0 ? "▲" : "▼";
            const sign = (n: number) => (n > 0 ? "+" : "−");
            return (
              <tr key={d.text} className="border-b border-border/50 last:border-0">
                <td className="py-2 pr-3 text-left text-foreground">{d.text}</td>
                <td className="py-2 px-3 text-right font-medium tabular-nums text-foreground">
                  {valueFormatter(d.nTimes)}
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">{pct}%</td>
                {hasPrev && (
                  <td className="py-2 pl-3 text-right tabular-nums text-muted-foreground">
                    {delta == null
                      ? "—"
                      : delta === 0
                        ? "no change"
                        : `${arrow} ${sign(delta)}${Math.abs(delta)}${
                            deltaPct != null ? ` (${sign(deltaPct)}${Math.abs(deltaPct)}%)` : ""
                          }`}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
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

  // Table renders from raw counts (it computes its own share-of-total), so build
  // it before the percent transform mutates `insights`.
  if (config?.chartType === "table") {
    const countFormatter =
      measure === "duration" ? formatDurationHuman : (v: number) => formatCount(v);
    return (
      <FieldDistributionTable
        rows={data?.insights ?? []}
        prev={data?.compareInsights ?? []}
        valueFormatter={countFormatter}
        measureLabel={labels.measureLabel}
      />
    );
  }

  let compareInsights: ChartInsight[] = data?.compareInsights ?? [];

  if (isPercent) {
    const total = insights.reduce((sum, d) => sum + d.nTimes, 0);
    insights = insights.map((d) => ({
      text: d.text,
      nTimes: total > 0 ? Number(((d.nTimes / total) * 100).toFixed(1)) : 0,
    }));
    if (compareInsights.length > 0) {
      const cTotal = compareInsights.reduce((sum, d) => sum + d.nTimes, 0);
      compareInsights = compareInsights.map((d) => ({
        text: d.text,
        nTimes: cTotal > 0 ? Number(((d.nTimes / cTotal) * 100).toFixed(1)) : 0,
      }));
    }
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

  const hasCompare = compareInsights.length > 0;
  return (
    <AnalyticsBarChart
      data={insights}
      compareData={hasCompare ? compareInsights : undefined}
      title={labels.title}
      tickMaxLength={16}
      chartLabel={hasCompare ? "This period" : labels.measureLabel}
      compareLabel={labels.compareLabel ?? "Previous period"}
      valueFormatter={valueFormatter}
      allowDecimals={measure !== "count" && !isSum}
      categoricalPalette
    />
  );
}
