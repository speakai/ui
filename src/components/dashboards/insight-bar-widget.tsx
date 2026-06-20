/**
 * Presentational bar-chart body shared by the People-breakdown and Team-activity
 * widgets — a ranked `{ text, nTimes }` bar chart. The host maps its own data
 * (speakers / team members) into `ChartInsight[]` and passes it pre-sorted (or
 * relies on the default descending sort here).
 *
 * These widgets carry PII/identity, so the server does NOT serve their data on
 * the public share endpoint — the dispatcher renders the unavailable placeholder
 * there instead of calling this body.
 */

import type { ChartInsight } from "../charts/chart-types";
import { AnalyticsBarChart } from "../charts/analytics-bar-chart";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { UsersIcon } from "./icons";
import type { WidgetCommonLabels } from "./types";

export interface InsightBarLabels extends WidgetCommonLabels {
  /** Chart accessible/figcaption title. */
  title: string;
  emptyTitle: string;
  emptyDescription?: string;
}

export interface InsightBarWidgetProps {
  data: ChartInsight[] | undefined;
  isLoading: boolean;
  isError: boolean;
  labels: InsightBarLabels;
  /** Max x-axis tick length before truncation. */
  tickMaxLength?: number;
  onRetry?: () => void;
}

export function InsightBarWidget({
  data,
  isLoading,
  isError,
  labels,
  tickMaxLength = 14,
  onRetry,
}: InsightBarWidgetProps) {
  if (isLoading) {
    return <div className="h-80 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  const insights = [...(data ?? [])].sort((a, b) => b.nTimes - a.nTimes);

  if (insights.length === 0) {
    return (
      <WidgetEmpty
        icon={<UsersIcon className="h-10 w-10" />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  return (
    <AnalyticsBarChart data={insights} title={labels.title} tickMaxLength={tickMaxLength} />
  );
}
