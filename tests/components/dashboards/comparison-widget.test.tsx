import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ComparisonWidget,
  type ComparisonWidgetData,
} from "../../../src/components/dashboards/comparison-widget";
import {
  SNAPSHOT_METRICS,
  resolveComparisonMetrics,
  resolveSnapshotMetrics,
} from "../../../src/components/dashboards/snapshot-metrics";

const LABELS = {
  title: "Folder comparison",
  empty: "No comparison yet",
  error: "Could not load comparison",
  retry: "Retry",
};

describe("ComparisonWidget", () => {
  it("renders counts and a plain-count delta for number metrics", () => {
    const data: ComparisonWidgetData = {
      aLabel: "Folder A",
      bLabel: "Folder B",
      metrics: [{ label: "Files", a: 1200, b: 1500, valueFormat: "number" }],
    };
    render(
      <ComparisonWidget
        data={data}
        isLoading={false}
        isError={false}
        labels={LABELS}
      />,
    );
    expect(screen.getByText("1,200")).toBeInTheDocument();
    expect(screen.getByText("1,500")).toBeInTheDocument();
    expect(screen.getByText("+300")).toBeInTheDocument();
  });

  it("formats duration metrics as human durations, not raw counts", () => {
    const data: ComparisonWidgetData = {
      aLabel: "Folder A",
      bLabel: "Folder B",
      metrics: [
        { label: "Total duration", a: 3600, b: 7200, valueFormat: "duration" },
      ],
    };
    render(
      <ComparisonWidget
        data={data}
        isLoading={false}
        isError={false}
        labels={LABELS}
      />,
    );
    expect(screen.getByText("1h")).toBeInTheDocument();
    expect(screen.getByText("2h")).toBeInTheDocument();
    // delta of 3600s renders as a duration, prefixed with the up-arrow sign
    expect(screen.getByText("+1h")).toBeInTheDocument();
    // the raw seconds must never leak through
    expect(screen.queryByText("3,600")).toBeNull();
    expect(screen.queryByText("7,200")).toBeNull();
  });

  it("defaults to a plain count when valueFormat is omitted", () => {
    const data: ComparisonWidgetData = {
      aLabel: "A",
      bLabel: "B",
      metrics: [{ label: "Files", a: 10, b: 8 }],
    };
    render(
      <ComparisonWidget
        data={data}
        isLoading={false}
        isError={false}
        labels={LABELS}
      />,
    );
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("−2")).toBeInTheDocument();
  });

  it("shows a dash when a value is missing and no delta can be computed", () => {
    const data: ComparisonWidgetData = {
      aLabel: "A",
      bLabel: "B",
      metrics: [{ label: "Files", a: null, b: 5, valueFormat: "number" }],
    };
    render(
      <ComparisonWidget
        data={data}
        isLoading={false}
        isError={false}
        labels={LABELS}
      />,
    );
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
  });

  it("renders empty / error / loading states", () => {
    const empty = render(
      <ComparisonWidget
        data={{ aLabel: "A", bLabel: "B", metrics: [] }}
        isLoading={false}
        isError={false}
        labels={LABELS}
      />,
    );
    expect(empty.getByText("No comparison yet")).toBeInTheDocument();

    const error = render(
      <ComparisonWidget isLoading={false} isError={true} labels={LABELS} />,
    );
    expect(error.getByText("Could not load comparison")).toBeInTheDocument();

    const loading = render(
      <ComparisonWidget isLoading={true} isError={false} labels={LABELS} />,
    );
    expect(loading.container.querySelector(".animate-pulse")).not.toBeNull();
  });
});

// Host apps build comparison rows from this registry, so a wrong key or delta shows a wrong KPI.
describe("snapshot metric registry", () => {
  it("keeps saved order and drops unknown keys and duplicates", () => {
    expect(resolveSnapshotMetrics(["totalWords", "bogus", "totalFiles", "totalWords"])).toEqual(["totalWords", "totalFiles"]);
    expect(resolveComparisonMetrics(["sentiment", "uniqueSpeakers", "sentiment"])).toEqual(["sentiment", "uniqueSpeakers"]);
  });

  it("only comparison metrics accept the sentiment extra", () => {
    expect(resolveSnapshotMetrics(["sentiment"])).toEqual([]);
  });

  it.each([[[]], [["bogus"]], [null]])("comparison falls back to the default rows for %j", (raw) => {
    expect(resolveComparisonMetrics(raw)).toEqual(["totalFiles", "totalDurationSeconds", "sentiment"]);
  });

  it("reads each metric's own current value and delta", () => {
    const current = { totalFiles: 3, totalDurationSeconds: 5400, totalWords: 900, uniqueSpeakers: 2 };
    const delta = { totalFilesDelta: 1, totalDurationSecondsDelta: -60, totalWordsDelta: 0, uniqueSpeakersDelta: null };
    const rows = Object.entries(SNAPSHOT_METRICS).map(([key, m]) => [key, m.getCurrent(current), m.getDelta(delta)]);
    expect(rows).toEqual([
      ["totalFiles", 3, 1],
      ["totalDurationSeconds", 5400, -60],
      ["totalWords", 900, 0],
      ["uniqueSpeakers", 2, null],
    ]);
    expect(SNAPSHOT_METRICS.totalDurationSeconds.format(5400)).toBe("1h 30m");
  });

  it("reports no delta, not zero change, when the snapshot has no previous period", () => {
    for (const m of Object.values(SNAPSHOT_METRICS)) {
      expect(m.getDelta(null)).toBeNull();
      expect(m.getDelta(undefined)).toBeNull();
    }
  });
});
