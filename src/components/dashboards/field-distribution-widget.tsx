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

export interface FieldDistributionLabels extends WidgetCommonLabels {
  /** Chart accessible/figcaption title. */
  title: string;
  emptyTitle: string;
  emptyDescription?: string;
}

export interface FieldDistributionWidgetProps {
  data: PublicFieldDistributionData | undefined;
  isLoading: boolean;
  isError: boolean;
  labels: FieldDistributionLabels;
  onRetry?: () => void;
}

export function FieldDistributionWidget({
  data,
  isLoading,
  isError,
  labels,
  onRetry,
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

  return <AnalyticsBarChart data={insights} title={labels.title} tickMaxLength={16} />;
}
