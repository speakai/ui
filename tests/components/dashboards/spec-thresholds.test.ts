import { describe, it, expect } from "vitest";
import {
  resolveThresholdStatus,
  thresholdFillVar,
  THRESHOLD_TEXT_CLASS,
  type SpecThreshold,
} from "../../../src/components/dashboards/spec-thresholds";

describe("resolveThresholdStatus", () => {
  it("returns null when no thresholds are given", () => {
    expect(resolveThresholdStatus(5)).toBeNull();
    expect(resolveThresholdStatus(5, [])).toBeNull();
  });

  it("returns null when nothing matches", () => {
    const thresholds: SpecThreshold[] = [
      { when: { op: "gte", value: 100 }, status: "critical" },
    ];
    expect(resolveThresholdStatus(99, thresholds)).toBeNull();
  });

  it("first match wins even when later rules also match", () => {
    const thresholds: SpecThreshold[] = [
      { when: { op: "gte", value: 50 }, status: "warn", label: "High" },
      { when: { op: "gte", value: 100 }, status: "critical", label: "Critical" },
    ];
    // 150 matches BOTH rules; the first (warn) must win.
    expect(resolveThresholdStatus(150, thresholds)).toEqual({
      status: "warn",
      label: "High",
    });
  });

  it("evaluates gte/gt/lt/lte boundaries correctly", () => {
    expect(
      resolveThresholdStatus(10, [{ when: { op: "gte", value: 10 }, status: "good" }]),
    ).toEqual({ status: "good", label: undefined });
    expect(
      resolveThresholdStatus(10, [{ when: { op: "gt", value: 10 }, status: "good" }]),
    ).toBeNull();
    expect(
      resolveThresholdStatus(10, [{ when: { op: "lte", value: 10 }, status: "good" }]),
    ).toEqual({ status: "good", label: undefined });
    expect(
      resolveThresholdStatus(10, [{ when: { op: "lt", value: 10 }, status: "good" }]),
    ).toBeNull();
  });

  it("between is inclusive on both bounds", () => {
    const thresholds: SpecThreshold[] = [
      { when: { op: "between", value: [10, 20] }, status: "warn" },
    ];
    expect(resolveThresholdStatus(10, thresholds)?.status).toBe("warn");
    expect(resolveThresholdStatus(20, thresholds)?.status).toBe("warn");
    expect(resolveThresholdStatus(15, thresholds)?.status).toBe("warn");
    expect(resolveThresholdStatus(9.999, thresholds)).toBeNull();
    expect(resolveThresholdStatus(20.001, thresholds)).toBeNull();
  });

  it("returns null for non-finite values", () => {
    const thresholds: SpecThreshold[] = [
      { when: { op: "lt", value: 100 }, status: "good" },
    ];
    expect(resolveThresholdStatus(NaN, thresholds)).toBeNull();
    expect(resolveThresholdStatus(Infinity, thresholds)).toBeNull();
  });
});

describe("threshold styling maps", () => {
  it("maps every status to a semantic text class", () => {
    expect(THRESHOLD_TEXT_CLASS.good).toBe("text-success");
    expect(THRESHOLD_TEXT_CLASS.warn).toBe("text-warning");
    expect(THRESHOLD_TEXT_CLASS.critical).toBe("text-destructive");
    expect(THRESHOLD_TEXT_CLASS.neutral).toBe("text-muted-foreground");
  });

  it("thresholdFillVar returns theme CSS vars, never hex", () => {
    expect(thresholdFillVar("good")).toBe("var(--color-success)");
    expect(thresholdFillVar("warn")).toBe("var(--color-warning)");
    expect(thresholdFillVar("critical")).toBe("var(--color-destructive)");
    expect(thresholdFillVar("neutral")).toBe("var(--color-muted-foreground)");
  });
});
