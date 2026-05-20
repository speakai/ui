/**
 * Shared data types consumed by the analytics chart components.
 * Intentionally flat — no TanStack, Zustand, or framework-specific deps.
 */

/** A single keyword/field analytics entry. */
export interface ChartInsight {
  text: string;
  nTimes: number;
}

/** The 7 sentiment bucket keys. */
export type SentimentValue =
  | "veryPositive"
  | "positive"
  | "slightlyPositive"
  | "neutral"
  | "slightlyNegative"
  | "negative"
  | "veryNegative";

/** Per-bucket entry returned by the sentiment API. */
export interface SentimentOverallEntry {
  label: SentimentValue;
  percentage: number;
  mediaCount: number;
}
