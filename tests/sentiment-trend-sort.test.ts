import { describe, expect, it } from "vitest";
import { sortSentimentSeries } from "../src/components/dashboards/sentiment-trend-widget";

describe("sortSentimentSeries", () => {
  it("orders interleaved months chronologically, values staying attached", () => {
    const { timeline, values } = sortSentimentSeries(
      ["2026-06-26", "2026-08-28", "2026-06-25"],
      [0.1, 0.9, 0.2],
    );
    expect(timeline).toEqual(["2026-06-25", "2026-06-26", "2026-08-28"]);
    expect(values).toEqual([0.2, 0.1, 0.9]);
  });

  it("keeps the ghost series aligned to its dates through the sort", () => {
    const { ghostValues } = sortSentimentSeries(
      ["2026-08-28", "2026-06-26"],
      [0.9, 0.1],
      [0.5, 0.4],
    );
    expect(ghostValues).toEqual([0.4, 0.5]);
  });

  it("returns no ghost series when none is given, and handles empty input", () => {
    expect(sortSentimentSeries([], []).timeline).toEqual([]);
    expect(sortSentimentSeries(["2026-01-01"], [1]).ghostValues).toBeUndefined();
  });
});
