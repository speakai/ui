/**
 * Sentiment-trend widget body (presentational) — compound sentiment over time as
 * a line chart on the [-1, 1] domain. Data is the shared `PublicSentimentData`.
 *
 * The optional `ghostValues` (prior-period compound series, aligned by index)
 * drives the faded comparison line; the host fetches and passes it.
 */

import type { PublicSentimentData } from "@speakai/shared";
import { AnalyticsLineChart } from "../charts/analytics-line-chart";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { ActivityIcon } from "./icons";
import type { WidgetCommonLabels } from "./types";

export interface SentimentTrendConfig {
  /** Prior-period compound series for the ghost line (aligned by index). */
  ghostValues?: number[];
}

export interface SentimentTrendLabels extends WidgetCommonLabels {
  /** Chart accessible/figcaption title. */
  title: string;
  emptyTitle: string;
  emptyDescription?: string;
  /** Legend/tooltip label for the prior-period ghost series. */
  ghostLabel?: string;
}

export interface SentimentTrendWidgetProps {
  data: PublicSentimentData | undefined;
  isLoading: boolean;
  isError: boolean;
  config?: SentimentTrendConfig;
  labels: SentimentTrendLabels;
  onRetry?: () => void;
}

export function SentimentTrendWidget({
  data,
  isLoading,
  isError,
  config,
  labels,
  onRetry,
}: SentimentTrendWidgetProps) {
  if (isLoading) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  const rate = data?.sentiment?.rate;
  const timeline = rate?.timeline ?? [];
  const values = rate?.compound ?? [];
  const ghostValues =
    config?.ghostValues && config.ghostValues.length > 0
      ? config.ghostValues
      : undefined;

  if (timeline.length === 0) {
    return (
      <WidgetEmpty
        icon={<ActivityIcon className="h-10 w-10" />}
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
      ghostValues={ghostValues}
      ghostLabel={labels.ghostLabel}
    />
  );
}
