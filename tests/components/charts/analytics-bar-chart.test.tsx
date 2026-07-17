import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { cloneElement, type ReactElement } from "react";
import { AnalyticsBarChart } from "../../../src/components/charts/analytics-bar-chart";

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

const SIX_CATEGORIES = [
  { text: "Alpha", nTimes: 4 },
  { text: "Bravo", nTimes: 7 },
  { text: "Charlie", nTimes: 2 },
  { text: "Delta", nTimes: 9 },
  { text: "Echo", nTimes: 5 },
  { text: "Foxtrot", nTimes: 3 },
];

function barFills(container: HTMLElement): Array<string | null> {
  return Array.from(
    container.querySelectorAll(
      ".recharts-bar-rectangle path, .recharts-bar-rectangle rect",
    ),
  ).map((el) => el.getAttribute("fill"));
}

describe("AnalyticsBarChart", () => {
  it("renders every bar in chart-1 by default", () => {
    const { container } = render(
      <AnalyticsBarChart data={SIX_CATEGORIES} title="Distribution" />,
    );
    const fills = barFills(container);
    expect(fills).toHaveLength(6);
    fills.forEach((fill) => expect(fill).toBe("var(--color-chart-1)"));
  });

  it("cycles the 5-color palette per bar when categoricalPalette is set", () => {
    const { container } = render(
      <AnalyticsBarChart
        data={SIX_CATEGORIES}
        title="Distribution"
        categoricalPalette
      />,
    );
    expect(barFills(container)).toEqual([
      "var(--color-chart-1)",
      "var(--color-chart-2)",
      "var(--color-chart-3)",
      "var(--color-chart-4)",
      "var(--color-chart-5)",
      "var(--color-chart-1)", // 6th bar wraps back to the start of the palette
    ]);
  });

  it("ignores categoricalPalette when compareData is present (series coloring wins)", () => {
    const { container } = render(
      <AnalyticsBarChart
        data={SIX_CATEGORIES.slice(0, 3)}
        compareData={[{ text: "Alpha", nTimes: 2 }]}
        title="Distribution"
        categoricalPalette
      />,
    );
    const fills = barFills(container);
    expect(fills.length).toBeGreaterThan(0);
    fills.forEach((fill) => {
      expect(["var(--color-chart-1)", "var(--color-chart-2)"]).toContain(fill);
    });
    expect(fills).not.toContain("var(--color-chart-3)");
  });

  it("wraps a long category label across two lines when a bar has room (flat)", () => {
    const { container } = render(
      <AnalyticsBarChart
        data={[{ text: "A very long category label", nTimes: 4 }]}
        title="Distribution"
        tickMaxLength={16}
      />,
    );
    const tick = container.querySelector("text.recharts-cartesian-axis-tick-value");
    // Flat layout: no rotation, and the label wraps into <tspan> lines instead
    // of being clipped to a single ellipsis-truncated line.
    expect(tick?.getAttribute("transform") ?? "").not.toContain("rotate");
    const lines = Array.from(tick?.querySelectorAll("tspan") ?? []).map((t) => t.textContent ?? "");
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).not.toContain("…");
  });

  it("angles and ellipsis-truncates x-axis ticks to tickMaxLength when bars are packed tight", () => {
    const data = Array.from({ length: 12 }, (_, i) => ({
      text: `A very long category label ${i}`,
      nTimes: i + 1,
    }));
    const { container } = render(
      <AnalyticsBarChart data={data} title="Distribution" tickMaxLength={16} />,
    );
    const texts = Array.from(
      container.querySelectorAll("text.recharts-cartesian-axis-tick-value"),
    )
      .filter((t) => t.getAttribute("transform")?.includes("rotate(-45"))
      .map((t) => t.textContent ?? "");
    expect(texts.length).toBeGreaterThan(0);
    // Angled = single line, capped at tickMaxLength (16) with a trailing ellipsis.
    expect(texts.every((s) => s.endsWith("…") && s.length <= 16)).toBe(true);
  });
});
