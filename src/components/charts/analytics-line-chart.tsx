import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "../../utils/cn";
import { useReducedMotion } from "./use-reduced-motion";

interface AnalyticsLineChartProps {
  timeline: string[];
  values: number[];
  title: string;
  className?: string;
  /** Y-axis domain. Defaults to [-1, 1] for sentiment. Pass "auto" for count data. */
  domain?: [number, number] | "auto";
  /** Tooltip value formatter. Defaults to 3 decimal places. */
  formatter?: (value: number) => string;
}

function formatDate(value: string): string {
  try {
    const d = new Date(value);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return value;
  }
}

export function AnalyticsLineChart({
  timeline,
  values,
  title,
  className,
  domain = [-1, 1],
  formatter = (value: number) => `${value.toFixed(3)}`,
}: AnalyticsLineChartProps) {
  const reducedMotion = useReducedMotion();
  const chartData = timeline.map((date, i) => ({
    date,
    compound: values[i] ?? 0,
  }));

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">{title}</figcaption>
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              stroke="var(--color-muted-foreground)"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
              domain={domain === "auto" ? undefined : domain}
              allowDecimals={domain !== "auto"}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-foreground)",
              }}
              formatter={(value) => formatter(Number(value))}
            />
            <Line
              type="monotone"
              dataKey="compound"
              stroke="var(--color-chart-1)"
              strokeWidth={2}
              dot={{ fill: "var(--color-chart-1)", r: 3 }}
              activeDot={{ r: 5 }}
              isAnimationActive={!reducedMotion}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
