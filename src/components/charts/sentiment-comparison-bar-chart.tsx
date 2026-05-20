import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { cn } from "../../utils/cn";
import { useReducedMotion } from "./use-reduced-motion";
import { SENTIMENT_OPTIONS } from "./sentiment-options";
import type { SentimentValue, SentimentOverallEntry } from "./chart-types";

interface SentimentComparisonBarChartProps {
  sentimentRate: Record<SentimentValue, SentimentOverallEntry>;
  compareSentimentRate: Record<SentimentValue, SentimentOverallEntry>;
  dataset1Label: string;
  dataset2Label: string;
  className?: string;
}

export function SentimentComparisonBarChart({
  sentimentRate,
  compareSentimentRate,
  dataset1Label,
  dataset2Label,
  className,
}: SentimentComparisonBarChartProps) {
  const reducedMotion = useReducedMotion();

  const chartData = SENTIMENT_OPTIONS.map((opt) => {
    const primary = sentimentRate[opt.value];
    const compare = compareSentimentRate[opt.value];
    return {
      name: opt.label,
      sentimentValue: opt.value,
      primary: primary?.percentage ?? 0,
      compare: compare?.percentage ?? 0,
    };
  });

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">
        Sentiment comparison: {dataset1Label} vs {dataset2Label}
      </figcaption>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              stroke="var(--color-muted-foreground)"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
              angle={-30}
              textAnchor="end"
              height={70}
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              tickFormatter={(v: number) => `${v}%`}
            />
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
            <Bar
              dataKey="primary"
              name={dataset1Label}
              fill="var(--color-chart-1)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reducedMotion}
            />
            <Bar
              dataKey="compare"
              name={dataset2Label}
              fill="var(--color-chart-2)"
              radius={[4, 4, 0, 0]}
              isAnimationActive={!reducedMotion}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
