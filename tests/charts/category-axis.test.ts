import { describe, it, expect } from "vitest";
import { computeCategoryAxis, wrapLabel } from "../../src/components/charts/category-axis";

describe("computeCategoryAxis", () => {
  it("lays labels flat with 2 lines when few wide bars have room", () => {
    const layout = computeCategoryAxis(4, 900, false);
    expect(layout.angle).toBe(0);
    expect(layout.textAnchor).toBe("middle");
    expect(layout.maxLines).toBe(2);
    // ~225px per bar → generous character budget, well above the 6-char floor.
    expect(layout.maxCharsPerLine).toBeGreaterThan(16);
  });

  it("angles and truncates to one line when bars are packed tight", () => {
    const layout = computeCategoryAxis(25, 700, false);
    expect(layout.angle).toBe(-45);
    expect(layout.textAnchor).toBe("end");
    expect(layout.maxLines).toBe(1);
  });

  it("always angles on mobile regardless of bar count", () => {
    const layout = computeCategoryAxis(3, 380, true);
    expect(layout.angle).toBe(-45);
    expect(layout.interval).toBeGreaterThanOrEqual(1);
  });

  it("honors a charCap upper bound in the flat layout (field-distribution keeps tickMaxLength=16)", () => {
    const layout = computeCategoryAxis(4, 1200, false, 16);
    expect(layout.angle).toBe(0);
    expect(layout.maxCharsPerLine).toBeLessThanOrEqual(16);
  });

  it("forces the angled layout when allowFlat=false (line/area time-series axes)", () => {
    const layout = computeCategoryAxis(4, 1200, false, 16, false);
    expect(layout.angle).toBe(-45);
    expect(layout.maxLines).toBe(1);
  });
});

describe("wrapLabel", () => {
  it("returns the text unchanged when it fits on one line", () => {
    expect(wrapLabel("Webb Insights", 20, 2)).toEqual(["Webb Insights"]);
  });

  it("ellipsis-truncates a single line past maxChars", () => {
    expect(wrapLabel("Northwind Software Group", 16, 1)).toEqual(["Northwind Softw…"]);
  });

  it("word-wraps across two lines", () => {
    expect(wrapLabel("Northwind Software", 10, 2)).toEqual([
      "Northwind",
      "Software",
    ]);
  });

  it("packs and truncates overflow onto the final allowed line", () => {
    const lines = wrapLabel("Atlas Product Group International Division", 10, 2);
    expect(lines.length).toBe(2);
    expect(lines[lines.length - 1].endsWith("…")).toBe(true);
  });

  it("hard-truncates a single word longer than maxChars (ellipsis counts toward the budget)", () => {
    expect(wrapLabel("Supercalifragilistic", 8, 1)).toEqual(["Superca…"]);
  });

  it("hard-truncates a single overlong token in 2-line mode (no-space slug/email does not overflow)", () => {
    expect(wrapLabel("Northwind_Software_International", 12, 2)).toEqual(["Northwind_S…"]);
    const single = wrapLabel("Supercalifragilistic", 8, 2);
    expect(single).toHaveLength(1);
    expect(single[0].endsWith("…")).toBe(true);
    expect(single[0].length).toBeLessThanOrEqual(8);
  });

  it("returns a single empty string for empty input", () => {
    expect(wrapLabel("", 10, 2)).toEqual([""]);
  });
});
