/**
 * Upload-timeline widget body (presentational) — uploads (audio + video + text)
 * over time as a line chart on a count domain. Data is the shared
 * `PublicUploadTimelineData`; the per-type date/count series are merged into one
 * chronological series here.
 *
 * The optional `ghostValues` (prior-period merged counts, aligned by ordinal
 * position) drives the faded comparison line; the host fetches and passes it.
 */

import type { PublicUploadTimelineData } from "@speakai/shared";
import { AnalyticsLineChart } from "../charts/analytics-line-chart";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { LineChartIcon } from "./icons";
import type { WidgetCommonLabels } from "./types";

export interface UploadTimelineConfig {
  /** Prior-period merged counts for the ghost line (aligned by ordinal position). */
  ghostValues?: number[];
}

export interface UploadTimelineLabels extends WidgetCommonLabels {
  /** Chart accessible/figcaption title. */
  title: string;
  emptyTitle: string;
  emptyDescription?: string;
  /** Legend/tooltip label for the prior-period ghost series. */
  ghostLabel?: string;
}

export interface UploadTimelineWidgetProps {
  data: PublicUploadTimelineData | undefined;
  isLoading: boolean;
  isError: boolean;
  config?: UploadTimelineConfig;
  labels: UploadTimelineLabels;
  onRetry?: () => void;
}

/** Sum audio/video/text counts per date into one chronological series. */
export function buildUploadTimeline(data: PublicUploadTimelineData | undefined): {
  timeline: string[];
  values: number[];
} {
  const totals = new Map<string, number>();
  const addSeries = (dates?: string[], counts?: number[]) => {
    if (!dates || !counts) return;
    dates.forEach((date, i) => {
      totals.set(date, (totals.get(date) ?? 0) + (counts[i] ?? 0));
    });
  };
  addSeries(data?.audio?.dates, data?.audio?.counts);
  addSeries(data?.video?.dates, data?.video?.counts);
  addSeries(data?.text?.dates, data?.text?.counts);

  const timeline = Array.from(totals.keys()).sort();
  const values = timeline.map((date) => totals.get(date) ?? 0);
  return { timeline, values };
}

export function UploadTimelineWidget({
  data,
  isLoading,
  isError,
  config,
  labels,
  onRetry,
}: UploadTimelineWidgetProps) {
  if (isLoading) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  const { timeline, values } = buildUploadTimeline(data);
  const ghostValues =
    config?.ghostValues && config.ghostValues.length > 0
      ? config.ghostValues
      : undefined;

  if (timeline.length === 0) {
    return (
      <WidgetEmpty
        icon={<LineChartIcon className="h-10 w-10" />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  return (
    <AnalyticsLineChart
      timeline={timeline}
      values={values}
      title={labels.title}
      domain="auto"
      formatter={(value) => `${Math.round(value)}`}
      ghostValues={ghostValues}
      ghostLabel={labels.ghostLabel}
    />
  );
}
