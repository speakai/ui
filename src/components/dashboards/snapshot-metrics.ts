/**
 * Snapshot delta-metric registry (pure) — the source of truth for the
 * period-over-period metrics shared by the `kpi-trend` and `comparison` widgets.
 *
 * Ported from speak-client as pure logic: icon glyphs swapped for the package's
 * inline icon set, and the i18n label removed (labels are injected per widget).
 */

import type { ComponentType } from "react";
import { FileAudioIcon, ClockIcon, TypeIcon, UsersIcon } from "./icons";
import { formatCount, formatDurationHuman } from "./format";

export type SnapshotMetricKey =
  | "totalFiles"
  | "totalDurationSeconds"
  | "totalWords"
  | "uniqueSpeakers";

/** The current-aggregate shape this registry reads from `snapshot.current`. */
export interface SnapshotCurrent {
  totalFiles: number;
  totalDurationSeconds: number;
  totalWords: number;
  uniqueSpeakers: number;
}

/** The delta shape this registry reads from `snapshot.delta`. */
export interface SnapshotDelta {
  totalFilesDelta: number | null;
  totalDurationSecondsDelta: number | null;
  totalWordsDelta: number | null;
  uniqueSpeakersDelta: number | null;
}

interface SnapshotMetricMeta {
  icon: ComponentType<{ className?: string }>;
  getCurrent: (current: SnapshotCurrent) => number;
  getDelta: (delta: SnapshotDelta | null | undefined) => number | null;
  format: (value: number) => string;
}

const formatNumber = (n: number) => formatCount(n);
const formatDuration = (n: number) => formatDurationHuman(n);

export const SNAPSHOT_METRICS: Record<SnapshotMetricKey, SnapshotMetricMeta> = {
  totalFiles: {
    icon: FileAudioIcon,
    getCurrent: (c) => c.totalFiles ?? 0,
    getDelta: (d) => d?.totalFilesDelta ?? null,
    format: formatNumber,
  },
  totalDurationSeconds: {
    icon: ClockIcon,
    getCurrent: (c) => c.totalDurationSeconds ?? 0,
    getDelta: (d) => d?.totalDurationSecondsDelta ?? null,
    format: formatDuration,
  },
  totalWords: {
    icon: TypeIcon,
    getCurrent: (c) => c.totalWords ?? 0,
    getDelta: (d) => d?.totalWordsDelta ?? null,
    format: formatNumber,
  },
  uniqueSpeakers: {
    icon: UsersIcon,
    getCurrent: (c) => c.uniqueSpeakers ?? 0,
    getDelta: (d) => d?.uniqueSpeakersDelta ?? null,
    format: formatNumber,
  },
};

/** Ordered list of every registry key — the canonical picker order. */
export const SNAPSHOT_METRIC_ORDER: SnapshotMetricKey[] = [
  "totalFiles",
  "totalDurationSeconds",
  "totalWords",
  "uniqueSpeakers",
];

/** The KPI-trend widget's default metric when its config selects none. */
export const DEFAULT_KPI_METRIC: SnapshotMetricKey = "totalFiles";

function isSnapshotMetricKey(value: unknown): value is SnapshotMetricKey {
  return typeof value === "string" && value in SNAPSHOT_METRICS;
}

/**
 * Resolve a raw `config.metrics` value into a deduped, registry-valid list of
 * delta-metric keys, preserving the saved order. Returns `[]` when nothing usable.
 */
export function resolveSnapshotMetrics(raw: unknown): SnapshotMetricKey[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<SnapshotMetricKey>();
  const resolved: SnapshotMetricKey[] = [];
  for (const item of raw) {
    if (isSnapshotMetricKey(item) && !seen.has(item)) {
      seen.add(item);
      resolved.push(item);
    }
  }
  return resolved;
}

/**
 * Resolve which KPI metrics to render, preferring the modern `config.metrics`
 * list and falling back to the legacy single `config.metric` (then the default).
 */
export function resolveKpiMetrics(
  metrics: unknown,
  legacyMetric: string | undefined,
): SnapshotMetricKey[] {
  const fromList = resolveSnapshotMetrics(metrics);
  if (fromList.length > 0) return fromList;
  if (legacyMetric && legacyMetric in SNAPSHOT_METRICS) {
    return [legacyMetric as SnapshotMetricKey];
  }
  return [DEFAULT_KPI_METRIC];
}

/**
 * A comparison metric is any shared delta metric plus the comparison-only
 * "sentiment" extra (current dominant sentiment only; no delta).
 */
export type ComparisonMetricKey = SnapshotMetricKey | "sentiment";

/** Default comparison selection when a widget has no usable `config.metrics`. */
export const DEFAULT_COMPARISON_METRICS: ComparisonMetricKey[] = [
  "totalFiles",
  "totalDurationSeconds",
  "sentiment",
];

function isComparisonMetricKey(value: unknown): value is ComparisonMetricKey {
  return value === "sentiment" || isSnapshotMetricKey(value);
}

/**
 * Resolve a comparison widget's raw `config.metrics` into a deduped, ordered list
 * of valid comparison keys, preserving the saved order. Falls back to default.
 */
export function resolveComparisonMetrics(raw: unknown): ComparisonMetricKey[] {
  if (!Array.isArray(raw)) return DEFAULT_COMPARISON_METRICS;
  const seen = new Set<ComparisonMetricKey>();
  const resolved: ComparisonMetricKey[] = [];
  for (const item of raw) {
    if (isComparisonMetricKey(item) && !seen.has(item)) {
      seen.add(item);
      resolved.push(item);
    }
  }
  return resolved.length > 0 ? resolved : DEFAULT_COMPARISON_METRICS;
}
