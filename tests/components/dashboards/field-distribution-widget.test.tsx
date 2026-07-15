import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { cloneElement, type ReactElement } from "react";
import { FieldDistributionWidget } from "../../../src/components/dashboards/field-distribution-widget";

// Recharts marks don't paint mid-animation in jsdom — force reduced motion so
// isAnimationActive is false and bars render synchronously.
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
  title: "Deal stage",
  emptyTitle: "No field data yet",
};

describe("FieldDistributionWidget", () => {
  it("renders bar-mode categories in distinct palette colors", () => {
    const { container } = render(
      <FieldDistributionWidget
        data={{
          insights: [
            { text: "Won", nTimes: 8 },
            { text: "Lost", nTimes: 3 },
            { text: "Open", nTimes: 5 },
          ],
          compareInsights: [],
        }}
        isLoading={false}
        isError={false}
        labels={LABELS}
      />,
    );
    const fills = Array.from(
      container.querySelectorAll(
        ".recharts-bar-rectangle path, .recharts-bar-rectangle rect",
      ),
    ).map((el) => el.getAttribute("fill"));
    expect(fills).toEqual([
      "var(--color-chart-1)",
      "var(--color-chart-2)",
      "var(--color-chart-3)",
    ]);
  });
});
