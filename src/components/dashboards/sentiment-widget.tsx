/**
 * Sentiment widget body (presentational) — overall sentiment distribution as a
 * pie chart. Data is the shared `PublicSentimentData`; the host fetches it.
 */

import type {
  PublicSentimentData,
  PublicSentimentLabel,
  PublicSentimentOverallEntry,
} from "@speakai/shared";
import { SentimentPieChart } from "../charts/sentiment-pie-chart";
import type {
  SentimentValue,
  SentimentOverallEntry,
} from "../charts/chart-types";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { PieChartIcon } from "./icons";
import type { WidgetCommonLabels } from "./types";

export interface SentimentLabels extends WidgetCommonLabels {
  /** Chart accessible/figcaption title. */
  title: string;
  emptyTitle: string;
  emptyDescription?: string;
}

export interface SentimentWidgetProps {
  data: PublicSentimentData | undefined;
  isLoading: boolean;
  isError: boolean;
  labels: SentimentLabels;
  onRetry?: () => void;
}

export function SentimentWidget({
  data,
  isLoading,
  isError,
  labels,
  onRetry,
}: SentimentWidgetProps) {
  if (isLoading) {
    return <div className="h-80 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  const overall = data?.sentiment?.rate?.overall;
  const hasData =
    overall && Object.values(overall).some((entry) => (entry?.percentage ?? 0) > 0);

  if (!hasData) {
    return (
      <WidgetEmpty
        icon={<PieChartIcon className="h-10 w-10" />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  // The shared PublicSentiment* shapes are structurally identical to the chart's
  // SentimentValue/SentimentOverallEntry maps.
  return (
    <SentimentPieChart
      data={
        overall as Record<PublicSentimentLabel, PublicSentimentOverallEntry> as Record<
          SentimentValue,
          SentimentOverallEntry
        >
      }
      title={labels.title}
    />
  );
}
