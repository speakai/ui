import { describe, expect, it } from "vitest";

import {
  formatCount,
  formatDurationHuman,
} from "../../src/components/dashboards/format";

describe("formatCount", () => {
  it("keeps two decimal places on fractional values", () => {
    expect(formatCount(4.8)).toBe("4.80");
    expect(formatCount(2.539)).toBe("2.54");
    expect(formatCount(4.999)).toBe("5.00");
    expect(formatCount(0.5)).toBe("0.50");
  });

  it("renders integers without decimals", () => {
    expect(formatCount(1)).toBe("1");
    expect(formatCount(13)).toBe("13");
    expect(formatCount(1327)).toBe("1,327");
    expect(formatCount(0)).toBe("0");
  });

  it("keeps compact notation for very large values", () => {
    expect(formatCount(1_500_000)).toBe("1.5M");
  });

  it("passes through non-numeric input", () => {
    expect(formatCount(NaN)).toBe("NaN");
  });
});

describe("formatDurationHuman", () => {
  it("is unchanged by the decimal work", () => {
    expect(formatDurationHuman(59)).toBe("59s");
    expect(formatDurationHuman(3600)).toBe("1h");
  });
});
