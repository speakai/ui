/**
 * Snapshot delta-metric registry (pure) — the source of truth for the
 * period-over-period snapshot metrics host apps resolve into comparison rows
 * and metric pickers. Icon glyphs come from the package's inline icon set;
 * labels are injected per widget (no i18n here).
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
