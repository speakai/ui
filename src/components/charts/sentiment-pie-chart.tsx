import { useCallback } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "../../utils/cn";
// recharts v3 does not flush the initial paint of animated <path> series (Pie) in Chrome; disable mount animation so sectors render in one synchronous paint.
import { SENTIMENT_OPTIONS } from "./sentiment-options";
import type { SentimentValue, SentimentOverallEntry } from "./chart-types";

// Map sentiment value to its CSS variable name
const SENTIMENT_CSS_VAR_MAP: Record<SentimentValue, string> = {
  veryPositive: "var(--color-chart-sentiment-very-positive)",
  positive: "var(--color-chart-sentiment-positive)",
  slightlyPositive: "var(--color-chart-sentiment-slightly-positive)",
  neutral: "var(--color-chart-sentiment-neutral)",
  slightlyNegative: "var(--color-chart-sentiment-slightly-negative)",
  negative: "var(--color-chart-sentiment-negative)",
  veryNegative: "var(--color-chart-sentiment-very-negative)",
};

interface SentimentPieChartProps {
  data: Record<SentimentValue, SentimentOverallEntry>;
  title: string;
  onSliceClick?: (sentimentValue: string) => void;
  className?: string;
}

export function SentimentPieChart({
  data,
  title,
  onSliceClick,
  className,
}: SentimentPieChartProps) {

  const pieData = SENTIMENT_OPTIONS.map((opt) => {
    const entry = data[opt.value];
    return {
      name: opt.label,
      value: entry?.percentage ?? 0,
      sentimentValue: opt.value,
      mediaCount: entry?.mediaCount ?? 0,
    };
  }).filter((d) => d.value > 0);

  const handleClick = useCallback(
    (entry: unknown) => {
      const sentimentValue = (entry as { sentimentValue?: SentimentValue } | null | undefined)
        ?.sentimentValue;
      if (onSliceClick && sentimentValue) {
        onSliceClick(sentimentValue);
      }
    },
    [onSliceClick],
  );

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">{title}</figcaption>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={320}>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={110}
              cursor={onSliceClick ? "pointer" : undefined}
              onClick={handleClick}
              isAnimationActive={false}
            >
              {pieData.map((entry) => (
                <Cell
                  key={entry.sentimentValue}
                  fill={SENTIMENT_CSS_VAR_MAP[entry.sentimentValue as SentimentValue]}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-foreground)",
              }}
              formatter={(value) => `${Number(value).toFixed(1)}%`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
