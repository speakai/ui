/**
 * Stat-card metric registry (pure) — the single source of truth for which usage
 * metrics the `stat-cards` widget can headline, in what order they default, and
 * how each maps a value out of an already-assembled values bag.
 *
 * Ported from speak-client as pure logic: icon glyphs swapped for the package's
 * inline icon set, and the i18n label removed (labels are injected per widget).
 */

import type { ComponentType } from "react";
import type { IconColor } from "../StatCard";
import {
  FileAudioIcon,
  HardDriveIcon,
  TypeIcon,
  UsersIcon,
  TimerIcon,
  SmileIcon,
} from "./icons";
import { formatFileSize, formatCount, formatDurationHuman } from "./format";

export type StatMetricKey =
  | "media"
  | "storage"
  | "words"
  | "speakers"
  | "duration"
  | "sentiment";

/** Raw values pulled from the host's data, normalised to numbers. */
export interface StatMetricValues {
  totalMedia: number;
  storageBytes: number;
  totalWords: number;
  uniqueSpeakers: number;
  totalDurationSeconds: number;
  /** Mean compound sentiment over the scope's timeline, on [-1, 1], or null. */
  avgSentiment: number | null;
}

/** Period-over-period deltas for the snapshot-backed cards. */
export interface StatMetricDeltas {
  totalWordsDelta: number | null;
  uniqueSpeakersDelta: number | null;
  totalDurationSecondsDelta: number | null;
}

interface StatMetricMeta {
  icon: ComponentType<{ className?: string }>;
  iconColor: IconColor;
  getValue: (values: StatMetricValues) => string;
  getDelta?: (deltas: StatMetricDeltas) => number | null;
  formatDelta?: (value: number) => string;
}

export const STAT_METRICS: Record<StatMetricKey, StatMetricMeta> = {
  media: {
    icon: FileAudioIcon,
    iconColor: "blue",
    getValue: (v) => formatCount(v.totalMedia),
  },
  storage: {
    icon: HardDriveIcon,
    iconColor: "purple",
    getValue: (v) => (v.storageBytes <= 0 ? "—" : formatFileSize(v.storageBytes)),
  },
  words: {
    icon: TypeIcon,
    iconColor: "pink",
    getValue: (v) => formatCount(v.totalWords),
    getDelta: (d) => d.totalWordsDelta,
    formatDelta: formatCount,
  },
  speakers: {
    icon: UsersIcon,
    iconColor: "blue",
    getValue: (v) => formatCount(v.uniqueSpeakers),
    getDelta: (d) => d.uniqueSpeakersDelta,
    formatDelta: formatCount,
  },
  duration: {
    icon: TimerIcon,
    iconColor: "purple",
    getValue: (v) => formatDurationHuman(v.totalDurationSeconds) || "0s",
    getDelta: (d) => d.totalDurationSecondsDelta,
    formatDelta: (n) => formatDurationHuman(n) || "0s",
  },
  sentiment: {
    icon: SmileIcon,
    iconColor: "green",
    getValue: (v) => (v.avgSentiment == null ? "—" : v.avgSentiment.toFixed(2)),
  },
};

/** Ordered list of every registry key — the canonical picker order. */
export const STAT_METRIC_ORDER: StatMetricKey[] = [
  "media",
  "storage",
  "words",
  "speakers",
  "duration",
  "sentiment",
];

/** Default selection when a widget has no `config.metrics` — the content-lens four. */
export const DEFAULT_STAT_METRICS: StatMetricKey[] = [
  "media",
  "duration",
  "words",
  "speakers",
];

function isStatMetricKey(value: unknown): value is StatMetricKey {
  return typeof value === "string" && value in STAT_METRICS;
}

/**
 * Resolve a widget's `config.metrics` into a deduped, registry-valid list of
 * metric keys, preserving the saved order. Falls back to the default four.
 */
export function resolveStatMetrics(raw: unknown): StatMetricKey[] {
  if (!Array.isArray(raw)) return DEFAULT_STAT_METRICS;
  const seen = new Set<StatMetricKey>();
  const resolved: StatMetricKey[] = [];
  for (const item of raw) {
    if (isStatMetricKey(item) && !seen.has(item)) {
      seen.add(item);
      resolved.push(item);
    }
  }
  return resolved.length > 0 ? resolved : DEFAULT_STAT_METRICS;
}

/** Mean of a compound-sentiment timeline on [-1, 1], or null when empty. */
export function meanCompound(values: number[] | undefined): number | null {
  if (!values || values.length === 0) return null;
  const sum = values.reduce((acc, n) => acc + n, 0);
  return sum / values.length;
}
