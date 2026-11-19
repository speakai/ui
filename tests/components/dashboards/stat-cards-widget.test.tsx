import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  StatCardsWidget,
  type StatCardsConfig,
} from "../../../src/components/dashboards/stat-cards-widget";
import {
  meanCompound,
  type StatMetricDeltas,
  type StatMetricValues,
} from "../../../src/components/dashboards/stat-metrics";

const LABELS = {
  metricLabels: {
    media: "Media",
    storage: "Storage",
    words: "Words",
    speakers: "Speakers",
    duration: "Duration",
    sentiment: "Sentiment",
  },
  noChangeLabel: "No change",
};
const LABEL_PATTERN = /^(Media|Storage|Words|Speakers|Duration|Sentiment)$/;

const VALUES: StatMetricValues = {
  totalMedia: 1234,
  storageBytes: 1536,
  totalWords: 1_234_567,
  uniqueSpeakers: 7,
  totalDurationSeconds: 5400,
  avgSentiment: 0.4567,
};

function renderWidget(opts: { data?: StatMetricValues; deltas?: StatMetricDeltas; config?: StatCardsConfig } = {}) {
  return render(
    <StatCardsWidget
      data={"data" in opts ? opts.data : VALUES}
      deltas={opts.deltas}
      isLoading={false}
      isError={false}
      config={opts.config}
      labels={LABELS}
    />,
  );
}

function shownLabels(): string[] {
  return screen.getAllByText(LABEL_PATTERN).map((el) => el.textContent!);
}

function card(label: string) {
  const labelEl = screen.getByText(label);
  const valueEl = labelEl.nextElementSibling!;
  return { value: valueEl.textContent, footer: valueEl.nextElementSibling?.textContent ?? null };
}

describe("StatCardsWidget metric selection", () => {
  it("shows the default four cards in order when config has no metrics", () => {
    renderWidget();
    expect(shownLabels()).toEqual(["Media", "Duration", "Words", "Speakers"]);
  });

  it("keeps the saved order, drops unknown keys and duplicates", () => {
    renderWidget({ config: { metrics: ["sentiment", "bogus", "storage", "sentiment", 42] } });
    expect(shownLabels()).toEqual(["Sentiment", "Storage"]);
  });

  it.each([
    ["an empty list", []],
    ["only unknown keys", ["bogus"]],
    ["a non-array", "media"],
  ])("falls back to the default four for %s", (_name, metrics) => {
    renderWidget({ config: { metrics } });
    expect(shownLabels()).toEqual(["Media", "Duration", "Words", "Speakers"]);
  });
});

describe("StatCardsWidget values", () => {
  it("formats each metric for display", () => {
    renderWidget({ config: { metrics: ["media", "storage", "words", "speakers", "duration", "sentiment"] } });
    expect(card("Media").value).toBe("1,234");
    expect(card("Storage").value).toBe("1.50 KB");
    expect(card("Words").value).toBe("1.2M");
    expect(card("Speakers").value).toBe("7");
    expect(card("Duration").value).toBe("1h 30m");
    expect(card("Sentiment").value).toBe("0.46");
  });

  it("shows zeros and dashes, not blanks or NaN, when the host has no data yet", () => {
    renderWidget({ data: undefined, config: { metrics: ["media", "storage", "duration", "sentiment"] } });
    expect(card("Media").value).toBe("0");
    expect(card("Storage").value).toBe("—");
    expect(card("Duration").value).toBe("0s");
    expect(card("Sentiment").value).toBe("—");
  });

  it("shows a neutral 0.00 sentiment instead of treating zero as missing", () => {
    renderWidget({ data: { ...VALUES, avgSentiment: 0 }, config: { metrics: ["sentiment"] } });
    expect(card("Sentiment").value).toBe("0.00");
  });

  it("hides the value of an unavailable card behind the placeholder", () => {
    renderWidget({ config: { metrics: ["media", "storage"], unavailableKeys: ["storage"] } });
    expect(card("Storage").value).toBe("—");
    expect(card("Media").value).toBe("1,234");
  });
});

describe("StatCardsWidget deltas", () => {
  const deltas: StatMetricDeltas = { totalWordsDelta: 1200, uniqueSpeakersDelta: null, totalDurationSecondsDelta: -90 };

  it("signs and formats each delta, using the absolute value for drops", () => {
    renderWidget({ deltas, config: { metrics: ["words", "duration", "speakers"], showDelta: true } });
    expect(card("Words").footer).toBe("+1,200");
    expect(card("Duration").footer).toBe("−1m");
    expect(card("Speakers").footer).toBe("No change");
  });

  it("gives metrics without a delta an empty footer, not a fake change", () => {
    renderWidget({ deltas, config: { metrics: ["media", "words"], showDelta: true } });
    expect(card("Media").footer!.trim()).toBe("");
  });

  it("shows no delta footer when showDelta is off", () => {
    renderWidget({ deltas, config: { metrics: ["words"] } });
    expect(card("Words").footer).toBeNull();
  });
});

describe("meanCompound", () => {
  it.each([
    [[0.5, -0.5, 1], 1 / 3],
    [[-1], -1],
  ])("averages %j", (values, expected) => {
    expect(meanCompound(values)).toBeCloseTo(expected, 10);
  });

  it.each([[[]], [undefined]])("returns null for %j so the card shows a dash, not NaN", (values) => {
    expect(meanCompound(values)).toBeNull();
  });
});
