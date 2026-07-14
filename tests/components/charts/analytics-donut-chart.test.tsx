import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { cloneElement, type ReactElement } from "react";
import { vi } from "vitest";
import { AnalyticsDonutChart } from "../../../src/components/charts/analytics-donut-chart";

// ResponsiveContainer measures the DOM, which is 0×0 in jsdom, so the chart
// never renders. Give the wrapped chart fixed dimensions instead.
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactElement }) => (
      <div style={{ width: 400, height: 320 }}>
        {cloneElement(children, { width: 400, height: 320 } as object)}
      </div>
    ),
  };
});

const SLICES = [
  { label: "Enterprise", value: 42 },
  { label: "Mid-Market", value: 30 },
  { label: "SMB", value: 18 },
  { label: "Startup", value: 10 },
];

describe("AnalyticsDonutChart", () => {
  // Regression guard: recharts v3 leaves animated <path> sectors unpainted until
  // a reflow, so the ring must render statically (isAnimationActive={false}). With
  // animation on, jsdom yields empty sector `d` strings and this assertion fails.
  it("draws a sector path per slice with non-empty geometry", () => {
    const { container } = render(
      <AnalyticsDonutChart data={SLICES} title="Deals by segment" />,
    );
    const sectors = container.querySelectorAll("path.recharts-sector");
    expect(sectors).toHaveLength(SLICES.length);
    sectors.forEach((s) => {
      expect(s.getAttribute("d")?.length ?? 0).toBeGreaterThan(0);
    });
  });

  it("renders the accessible figcaption title", () => {
    const { container } = render(
      <AnalyticsDonutChart data={SLICES} title="Deals by segment" />,
    );
    expect(container.querySelector("figcaption")?.textContent).toBe(
      "Deals by segment",
    );
  });
});
