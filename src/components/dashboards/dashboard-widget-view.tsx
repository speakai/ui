/**
 * DashboardWidgetView — the single presentational entry point both speak-client
 * (TanStack) and speak-media-library (fetch client) call to render a dashboard
 * widget body identically.
 *
 * Given a discriminated `{ type, ... }` props object, it renders the matching
 * widget component. The host owns all data fetching and string localisation and
 * passes them in; this dispatcher contains no hooks, no i18n, no app imports.
 *
 * The card chrome (title bar, settings, drag handle) stays in each app — this
 * renders the widget BODY only.
 */

import { StatCardsWidget, type StatCardsWidgetProps } from "./stat-cards-widget";
import {
  SentimentTrendWidget,
  type SentimentTrendWidgetProps,
} from "./sentiment-trend-widget";
import {
  FieldDistributionWidget,
  type FieldDistributionWidgetProps,
} from "./field-distribution-widget";
import { ThemesWidget, type ThemesWidgetProps } from "./themes-widget";
import { ComparisonWidget, type ComparisonWidgetProps } from "./comparison-widget";
import { InsightBarWidget, type InsightBarWidgetProps } from "./insight-bar-widget";
import { NotesWidget, type NotesWidgetProps } from "./notes-widget";
import { NarrativeWidget, type NarrativeWidgetProps } from "./narrative-widget";
import {
  MetricChartWidget,
  type MetricChartWidgetProps,
} from "./metric-chart-widget";
import { TableWidget, type TableWidgetProps } from "./table-widget";
import {
  PublicUnavailableWidget,
  type PublicUnavailableLabels,
} from "./public-unavailable-widget";

/**
 * Discriminated union of every widget's props, keyed by `type`. Each member is
 * exactly the props the corresponding widget body requires, so the consuming app
 * gets full type-checking on the data/config/labels it must satisfy.
 *
 * `people` and `team-activity` share the `InsightBarWidget` body (a ranked
 * `ChartInsight[]` bar chart); the host maps its own data into that shape.
 */
export type DashboardWidgetViewProps =
  | ({ type: "stat-cards" } & StatCardsWidgetProps)
  | ({ type: "sentiment-trend" } & SentimentTrendWidgetProps)
  | ({ type: "field-distribution" } & FieldDistributionWidgetProps)
  | ({ type: "themes" } & ThemesWidgetProps)
  | ({ type: "comparison" } & ComparisonWidgetProps)
  | ({ type: "people" } & InsightBarWidgetProps)
  | ({ type: "team-activity" } & InsightBarWidgetProps)
  | ({ type: "notes" } & NotesWidgetProps)
  | ({ type: "narrative" } & NarrativeWidgetProps)
  | ({ type: "metric-chart" } & MetricChartWidgetProps)
  | ({ type: "table" } & TableWidgetProps)
  | { type: "public-unavailable"; labels: PublicUnavailableLabels };

export function DashboardWidgetView(props: DashboardWidgetViewProps) {
  switch (props.type) {
    case "stat-cards":
      return <StatCardsWidget {...props} />;
    case "sentiment-trend":
      return <SentimentTrendWidget {...props} />;
    case "field-distribution":
      return <FieldDistributionWidget {...props} />;
    case "themes":
      return <ThemesWidget {...props} />;
    case "comparison":
      return <ComparisonWidget {...props} />;
    case "people":
    case "team-activity":
      return <InsightBarWidget {...props} />;
    case "notes":
      return <NotesWidget {...props} />;
    case "narrative":
      return <NarrativeWidget {...props} />;
    case "metric-chart":
      return <MetricChartWidget {...props} />;
    case "table":
      return <TableWidget {...props} />;
    case "public-unavailable":
      return <PublicUnavailableWidget labels={props.labels} />;
    default: {
      const _exhaustive: never = props;
      void _exhaustive;
      return null;
    }
  }
}
