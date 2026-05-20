import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
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
import type { ChartInsight } from "./chart-types";

interface AnalyticsBarChartProps {
  data: ChartInsight[];
  compareData?: ChartInsight[];
  title: string;
  chartLabel?: string;
  compareLabel?: string;
  maxBars?: number;
  tickMaxLength?: number;
  onBarClick?: (text: string) => void;
  containerRef?: RefObject<HTMLDivElement | null>;
  className?: string;
}

export function AnalyticsBarChart({
  data,
  compareData,
  title,
  chartLabel,
  compareLabel,
  maxBars = 25,
  tickMaxLength,
  onBarClick,
  containerRef: externalRef,
  className,
}: AnalyticsBarChartProps) {
  const internalRef = useRef<HTMLDivElement>(null);
  const chartRef = externalRef ?? internalRef;

  const [containerWidth, setContainerWidth] = useState(800);
  useEffect(() => {
    const el = (chartRef as RefObject<HTMLDivElement>).current;
    if (!el) return;

    let timeout: ReturnType<typeof setTimeout>;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        const width = entries[0]?.contentRect.width;
        if (width && width > 0) setContainerWidth(Math.floor(width));
      }, 100);
    });

    observer.observe(el);
    setContainerWidth(Math.floor(el.clientWidth));
    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [chartRef]);

  const isMobile = containerWidth < 400;
  const reducedMotion = useReducedMotion();

  const chartData = (() => {
    if (!compareData || compareData.length === 0) {
      return data
        .slice(0, maxBars)
        .map((d) => ({ text: d.text, nTimes: d.nTimes }));
    }
    const merged = new Map<string, { nTimes: number; compareNTimes: number }>();
    for (const d of data) {
      merged.set(d.text, { nTimes: d.nTimes, compareNTimes: 0 });
    }
    for (const d of compareData) {
      const existing = merged.get(d.text);
      if (existing) {
        existing.compareNTimes = d.nTimes;
      } else {
        merged.set(d.text, { nTimes: 0, compareNTimes: d.nTimes });
      }
    }
    return Array.from(merged.entries())
      .slice(0, maxBars)
      .map(([text, vals]) => ({ text, ...vals }));
  })();

  const handleBarClick = useCallback(
    (entry: { payload?: { text?: string } }, _index: number) => {
      if (onBarClick && entry.payload?.text) {
        onBarClick(entry.payload.text);
      }
    },
    [onBarClick],
  );

  return (
    <figure className={cn("w-full", className)}>
      <figcaption className="sr-only">{title}</figcaption>
      <div ref={chartRef as RefObject<HTMLDivElement>} aria-hidden="true">
        <ResponsiveContainer width="100%" height={isMobile ? 280 : 400}>
          <BarChart
            data={chartData}
            margin={{
              top: 10,
              right: isMobile ? 8 : 20,
              left: 0,
              bottom: isMobile ? 40 : 60,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="text"
              stroke="var(--color-muted-foreground)"
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: isMobile ? 10 : 12,
              }}
              angle={-45}
              textAnchor="end"
              interval={isMobile ? Math.max(1, Math.ceil(chartData.length / 6) - 1) : 0}
              height={isMobile ? 50 : 80}
              tickFormatter={(v: string) =>
                tickMaxLength && v?.length > tickMaxLength
                  ? v.slice(0, tickMaxLength) + "…"
                  : (v ?? "")
              }
            />
            <YAxis
              stroke="var(--color-muted-foreground)"
              tick={{
                fill: "var(--color-muted-foreground)",
                fontSize: isMobile ? 10 : 12,
              }}
              width={isMobile ? 28 : 40}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--color-background)",
                border: "1px solid var(--color-border)",
                borderRadius: "6px",
                color: "var(--color-foreground)",
              }}
            />
            {compareData && <Legend />}
            <Bar
              dataKey="nTimes"
              name={chartLabel || "Count"}
              fill="var(--color-chart-1)"
              radius={[4, 4, 0, 0]}
              cursor={onBarClick ? "pointer" : undefined}
              onClick={handleBarClick}
              isAnimationActive={!reducedMotion}
            />
            {compareData && (
              <Bar
                dataKey="compareNTimes"
                name={compareLabel || "Compare"}
                fill="var(--color-chart-2)"
                radius={[4, 4, 0, 0]}
                isAnimationActive={!reducedMotion}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
