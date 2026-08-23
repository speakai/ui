import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { AnalyticsWordCloud } from "../../src/components/charts/analytics-word-cloud";
import type { ChartInsight } from "../../src/components/charts/chart-types";

let capturedProps: { width: number; height: number } | null = null;

vi.mock("@isoterik/react-word-cloud", () => ({
  WordCloud: (props: { width: number; height: number }) => {
    capturedProps = { width: props.width, height: props.height };
    return <svg data-testid="word-cloud-svg" />;
  },
}));

let resizeCallback: ResizeObserverCallback | null = null;

class CapturingResizeObserver {
  constructor(callback: ResizeObserverCallback) {
    resizeCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

const DATA: ChartInsight[] = [
  { text: "alpha", nTimes: 10 },
  { text: "beta", nTimes: 5 },
];

async function triggerResize(width: number, height: number) {
  resizeCallback?.(
    [{ contentRect: { width, height } } as ResizeObserverEntry],
    {} as ResizeObserver,
  );
  // measure() is debounced behind a 150ms setTimeout
  await new Promise((r) => setTimeout(r, 250));
}

describe("AnalyticsWordCloud container height clamp", () => {
  afterEach(() => {
    cleanup();
    capturedProps = null;
    resizeCallback = null;
    vi.unstubAllGlobals();
  });

  it("clamps an unbounded measured height to the same 600px cap as width (RangeError regression, EMBED-MEDIA-LIBRARY-5)", async () => {
    vi.stubGlobal("ResizeObserver", CapturingResizeObserver);

    render(<AnalyticsWordCloud data={DATA} />);
    await screen.findByTestId("word-cloud-svg");

    // Simulate the unbounded-growth feedback loop: the SVG has no intrinsic
    // height, so a naive layout reports a huge measured height back in.
    await triggerResize(600, 50000);
    await vi.waitFor(() => expect(capturedProps?.height).toBeDefined());

    expect(capturedProps?.height).toBe(600);
    expect(capturedProps?.height).toBeLessThanOrEqual(600);
  }, 10000);

  it("still floors a too-small measured height at 160px (unchanged prior behavior)", async () => {
    vi.stubGlobal("ResizeObserver", CapturingResizeObserver);

    render(<AnalyticsWordCloud data={DATA} />);
    await screen.findByTestId("word-cloud-svg");

    await triggerResize(600, 20);
    await vi.waitFor(() => expect(capturedProps?.height).toBeDefined());

    expect(capturedProps?.height).toBe(160);
  }, 10000);
});
