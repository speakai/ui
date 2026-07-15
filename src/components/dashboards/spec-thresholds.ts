/**
 * Spec-driven threshold evaluation for dashboard widgets.
 *
 * A widget spec may attach an ordered list of `SpecThreshold` rules to a metric
 * or table column; `resolveThresholdStatus` evaluates a numeric value against
 * them (first match wins) and returns a semantic status the widgets translate
 * into text classes (`THRESHOLD_TEXT_CLASS`) or chart fills (`thresholdFillVar`).
 * Pure module — no React, no i18n.
 */

export type SpecThresholdWhen =
  | { op: "gte" | "gt" | "lt" | "lte"; value: number }
  | { op: "between"; value: [number, number] };

export type ThresholdStatus = "good" | "warn" | "critical" | "neutral";

export interface SpecThreshold {
  when: SpecThresholdWhen;
  status: ThresholdStatus;
  label?: string;
}

function matches(value: number, when: SpecThresholdWhen): boolean {
  switch (when.op) {
    case "gte":
      return value >= when.value;
    case "gt":
      return value > when.value;
    case "lt":
      return value < when.value;
    case "lte":
      return value <= when.value;
    case "between": {
      const [low, high] = when.value;
      return value >= low && value <= high;
    }
  }
}

/**
 * Evaluate `value` against an ordered threshold list. First match wins;
 * `between` is inclusive on both bounds. Returns null when nothing matches
 * (or no thresholds are given) so callers can fall back to default styling.
 */
export function resolveThresholdStatus(
  value: number,
  thresholds?: readonly SpecThreshold[],
): { status: ThresholdStatus; label?: string } | null {
  if (!thresholds || thresholds.length === 0 || !Number.isFinite(value)) {
    return null;
  }
  for (const t of thresholds) {
    if (matches(value, t.when)) {
      return { status: t.status, label: t.label };
    }
  }
  return null;
}

/** Tailwind text-color class per status (same tokens `DeltaCaption` uses). */
export const THRESHOLD_TEXT_CLASS: Record<ThresholdStatus, string> = {
  good: "text-success",
  warn: "text-warning",
  critical: "text-destructive",
  neutral: "text-muted-foreground",
};

/** CSS var per status for chart mark fills (all exist in the package theme). */
export const THRESHOLD_FILL_VAR: Record<ThresholdStatus, string> = {
  good: "var(--color-success)",
  warn: "var(--color-warning)",
  critical: "var(--color-destructive)",
  neutral: "var(--color-muted-foreground)",
};

/** The chart fill CSS var string for a threshold status. */
export function thresholdFillVar(status: ThresholdStatus): string {
  return THRESHOLD_FILL_VAR[status];
}
