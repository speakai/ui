import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  ComparisonWidget,
  type ComparisonWidgetData,
} from "../../../src/components/dashboards/comparison-widget";

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
