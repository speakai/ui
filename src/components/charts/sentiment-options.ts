/**
 * Ordered 7-bucket sentiment options with display labels and score thresholds.
 * Business rule: these exact min/max values drive sentiment classification — do not alter.
 */
export const SENTIMENT_OPTIONS = [
  { value: "veryPositive" as const, label: "Very positive", min: 0.75, max: 1 },
  { value: "positive" as const, label: "Positive", min: 0.25, max: 0.75 },
  { value: "slightlyPositive" as const, label: "Slightly positive", min: 0.01, max: 0.25 },
  { value: "neutral" as const, label: "Neutral", min: 0, max: 0 },
  { value: "slightlyNegative" as const, label: "Slightly negative", min: -0.26, max: 0 },
  { value: "negative" as const, label: "Negative", min: -0.75, max: -0.25 },
  { value: "veryNegative" as const, label: "Very negative", min: -1, max: -0.75 },
] as const;
