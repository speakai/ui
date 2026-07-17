/**
 * Themes widget body (presentational) — dominant theme clusters as a word cloud
 * (default) or a bar chart (`config.chartType === "bar"`). Data is the shared
 * `PublicThemesData`; cluster `{ name, nTimes }` rows map to chart `{ text, nTimes }`.
 */

import type { PublicThemesData } from "@speakai/shared";
import { AnalyticsWordCloud } from "../charts/analytics-word-cloud";
import { AnalyticsBarChart } from "../charts/analytics-bar-chart";
import type { ChartInsight } from "../charts/chart-types";
import { WidgetError, WidgetEmpty } from "./widget-states";
import { HashIcon } from "./icons";
import type { WidgetCommonLabels } from "./types";

export interface ThemesConfig {
  /** "bar" renders a bar chart; otherwise a word cloud. */
  chartType?: string;
}

export interface ThemesLabels extends WidgetCommonLabels {
  /** Chart accessible/figcaption title (bar mode). */
  title: string;
  emptyTitle: string;
  emptyDescription?: string;
}

export interface ThemesWidgetProps {
  data: PublicThemesData | undefined;
  isLoading: boolean;
  isError: boolean;
  config?: ThemesConfig;
  labels: ThemesLabels;
  onRetry?: () => void;
  /** Called with the clicked theme name (word cloud or bar) — e.g. to drive a search/filter. */
  onWordClick?: (text: string) => void;
}

export function ThemesWidget({
  data,
  isLoading,
  isError,
  config,
  labels,
  onRetry,
  onWordClick,
}: ThemesWidgetProps) {
  if (isLoading) {
    return <div className="h-72 w-full animate-pulse rounded-xl bg-muted" aria-hidden="true" />;
  }

  if (isError) {
    return <WidgetError labels={labels} onRetry={onRetry} />;
  }

  const insights: ChartInsight[] = (data?.clusters ?? []).map((cluster) => ({
    text: cluster.name,
    nTimes: cluster.nTimes,
  }));

  if (insights.length === 0) {
    return (
      <WidgetEmpty
        icon={<HashIcon className="h-10 w-10" />}
        title={labels.emptyTitle}
        description={labels.emptyDescription}
      />
    );
  }

  if (config?.chartType === "bar") {
    return (
      <AnalyticsBarChart
        data={insights}
        title={labels.title}
        tickMaxLength={16}
        onBarClick={onWordClick}
      />
    );
  }

  return <AnalyticsWordCloud data={insights} onWordClick={onWordClick} />;
}
