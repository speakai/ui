/**
 * Grouped sub-path export for the presentational dashboard widgets.
 *
 * `@speakai/ui/dashboard-widgets` exposes the `DashboardWidgetView` dispatcher,
 * every widget body, their labels/config prop contracts, the pure metric
 * registries + format/brand helpers, and the widget icon set. Both speak-client
 * (TanStack) and speak-media-library (fetch client) import from here so the same
 * widgets render identically in the builder and the public view.
 */

// ── Dispatcher ─────────────────────────────────────────────────────────────
export {
  DashboardWidgetView,
  type DashboardWidgetViewProps,
} from "../components/dashboards/dashboard-widget-view";

// ── Widget bodies ──────────────────────────────────────────────────────────
export {
  StatCardsWidget,
  type StatCardsWidgetProps,
  type StatCardsConfig,
  type StatCardsLabels,
} from "../components/dashboards/stat-cards-widget";
export {
  SentimentTrendWidget,
  type SentimentTrendWidgetProps,
  type SentimentTrendConfig,
  type SentimentTrendLabels,
} from "../components/dashboards/sentiment-trend-widget";
export {
  FieldDistributionWidget,
  type FieldDistributionWidgetProps,
  type FieldDistributionConfig,
  type FieldDistributionLabels,
} from "../components/dashboards/field-distribution-widget";
export {
  ThemesWidget,
  type ThemesWidgetProps,
  type ThemesConfig,
  type ThemesLabels,
} from "../components/dashboards/themes-widget";
export {
  ComparisonWidget,
  type ComparisonWidgetProps,
  type ComparisonWidgetLabels,
  type ComparisonWidgetData,
  type ComparisonMetricRow,
} from "../components/dashboards/comparison-widget";
export {
  MetricChartWidget,
  type MetricChartWidgetProps,
  type MetricChartWidgetConfig,
  type MetricChartWidgetLabels,
  type MetricChartData,
  type MetricChartDatum,
} from "../components/dashboards/metric-chart-widget";
export {
  TableWidget,
  type TableWidgetProps,
  type TableWidgetConfig,
  type TableWidgetLabels,
  type TableWidgetData,
  type TableWidgetRow,
  type TableWidgetColumn,
} from "../components/dashboards/table-widget";
export {
  NarrativeWidget,
  type NarrativeWidgetProps,
  type NarrativeWidgetLabels,
} from "../components/dashboards/narrative-widget";
export {
  InsightBarWidget,
  type InsightBarWidgetProps,
  type InsightBarLabels,
} from "../components/dashboards/insight-bar-widget";
export {
  NotesWidget,
  type NotesWidgetProps,
  type NotesConfig,
  type NotesLabels,
} from "../components/dashboards/notes-widget";
export {
  PublicUnavailableWidget,
  type PublicUnavailableLabels,
} from "../components/dashboards/public-unavailable-widget";

// ── Shared widget prop contracts ───────────────────────────────────────────
export type {
  WidgetDataState,
  WidgetCommonLabels,
} from "../components/dashboards/types";

// ── Pure metric registries ─────────────────────────────────────────────────
export {
  STAT_METRICS,
  STAT_METRIC_ORDER,
  DEFAULT_STAT_METRICS,
  resolveStatMetrics,
  meanCompound,
  type StatMetricKey,
  type StatMetricValues,
  type StatMetricDeltas,
} from "../components/dashboards/stat-metrics";
export {
  SNAPSHOT_METRICS,
  SNAPSHOT_METRIC_ORDER,
  DEFAULT_KPI_METRIC,
  DEFAULT_COMPARISON_METRICS,
  resolveSnapshotMetrics,
  resolveKpiMetrics,
  resolveComparisonMetrics,
  type SnapshotMetricKey,
  type SnapshotCurrent,
  type SnapshotDelta,
  type ComparisonMetricKey,
} from "../components/dashboards/snapshot-metrics";

// ── Spec threshold evaluation ──────────────────────────────────────────────
export {
  resolveThresholdStatus,
  thresholdFillVar,
  THRESHOLD_TEXT_CLASS,
  THRESHOLD_FILL_VAR,
  type SpecThreshold,
  type SpecThresholdWhen,
  type ThresholdStatus,
} from "../components/dashboards/spec-thresholds";

// ── Chart primitives ───────────────────────────────────────────────────────
export {
  AnalyticsDonutChart,
  chartSeriesVar,
  type AnalyticsDonutChartProps,
  type DonutSlice,
} from "../components/charts/analytics-donut-chart";

// ── Pure presentational helpers ────────────────────────────────────────────
export {
  isHexColor,
  expandHex,
  adjustBrandColorForTheme,
  brandStyle,
  brandFontStyle,
} from "../components/dashboards/brand-style";
export {
  formatFileSize,
  formatNumberSuffix,
  formatDurationHuman,
} from "../components/dashboards/format";
