import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { cloneElement, type ReactElement } from "react";
import {
  MetricChartWidget,
  type MetricChartData,
} from "../../../src/components/dashboards/metric-chart-widget";

// Recharts marks don't paint mid-animation in jsdom — force reduced motion so
// isAnimationActive is false and bars/lines render synchronously.
vi.mock("../../../src/components/charts/use-reduced-motion", () => ({
  useReducedMotion: () => true,
}));

// ResponsiveContainer measures the DOM, which is 0×0 in jsdom, so the chart
// never renders. Give the wrapped chart fixed dimensions instead.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) => (
      <div style={{ width: 800, height: 400 }}>
        {cloneElement(children, { width: 800, height: 400 } as object)}
      </div>
    ),
  };
});

const LABELS = {
  title: "Sessions by week",
  empty: "No data yet",
  emptyDescription: "Upload media to see this chart.",
  error: "Could not load chart",
  retry: "Retry",
};

const TWO_SERIES_DATA: MetricChartData = {
  rows: [
    { group: "W1", series: "Sales", value: 10 },
    { group: "W1", series: "Support", value: 4 },
    { group: "W2", series: "Sales", value: 12 },
    { group: "W2", series: "Support", value: 6 },
  ],
};

describe("MetricChartWidget", () => {
  it("renders one recharts line per distinct series value", () => {
    const { container } = render(
      <MetricChartWidget
        data={TWO_SERIES_DATA}
        isLoading={false}
        isError={false}
        config={{ mark: "line" }}
        labels={LABELS}
      />,
    );
    expect(container.querySelectorAll(".recharts-line")).toHaveLength(2);
  });

  it("shows a legend only when there is more than one series", () => {
    const { container } = render(
      <MetricChartWidget
        data={TWO_SERIES_DATA}
        isLoading={false}
        isError={false}
        config={{ mark: "line" }}
        labels={LABELS}
      />,
    );
    expect(container.querySelector(".recharts-legend-wrapper")).not.toBeNull();

    const single = render(
      <MetricChartWidget
        data={{ rows: [{ group: "W1", value: 3 }] }}
        isLoading={false}
        isError={false}
        config={{ mark: "line" }}
        labels={LABELS}
      />,
    );
    expect(single.container.querySelector(".recharts-legend-wrapper")).toBeNull();
  });

  it("renders the accessible figcaption title", () => {
    const { container } = render(
      <MetricChartWidget
        data={TWO_SERIES_DATA}
        isLoading={false}
        isError={false}
        config={{ mark: "bar" }}
        labels={LABELS}
      />,
    );
    expect(container.querySelector("figcaption")?.textContent).toBe(
      "Sessions by week",
    );
  });

  it("shows the empty state when rows are empty", () => {
    const { getByText, container } = render(
      <MetricChartWidget
        data={{ rows: [] }}
        isLoading={false}
        isError={false}
        config={{ mark: "bar" }}
        labels={LABELS}
      />,
    );
    expect(getByText("No data yet")).toBeInTheDocument();
    expect(container.querySelector("figure")).toBeNull();
  });

  it("shows the error state with a retry hook", () => {
    const onRetry = vi.fn();
    const { getByText } = render(
      <MetricChartWidget
        isLoading={false}
        isError={true}
        config={{ mark: "line" }}
        labels={LABELS}
        onRetry={onRetry}
      />,
    );
    expect(getByText("Could not load chart")).toBeInTheDocument();
    getByText("Retry").click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("renders a pulse skeleton while loading", () => {
    const { container } = render(
      <MetricChartWidget
        isLoading={true}
        isError={false}
        config={{ mark: "line" }}
        labels={LABELS}
      />,
    );
    expect(container.querySelector(".animate-pulse")).not.toBeNull();
  });

  it("colors single-series bar marks by threshold status", () => {
    const { container } = render(
      <MetricChartWidget
        data={{
          rows: [
            { group: "A", value: 5 },
            { group: "B", value: 150 },
          ],
        }}
        isLoading={false}
        isError={false}
        config={{
          mark: "bar",
          thresholds: [{ when: { op: "gte", value: 100 }, status: "critical" }],
        }}
        labels={LABELS}
      />,
    );
    const fills = Array.from(
      container.querySelectorAll(".recharts-bar-rectangle path, .recharts-bar-rectangle rect"),
    ).map((el) => el.getAttribute("fill"));
    expect(fills).toContain("var(--color-destructive)");
    expect(fills).toContain("var(--color-chart-1)");
  });
});
