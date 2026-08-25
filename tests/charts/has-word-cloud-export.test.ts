import { describe, it, expect } from "vitest";
import { hasWordCloudExport } from "../../src/components/charts/analytics-word-cloud";

describe("hasWordCloudExport", () => {
  it("accepts a module namespace carrying the export", () => {
    expect(hasWordCloudExport({ WordCloud: () => null })).toBe(true);
  });

  it("rejects a chunk that resolved without the export", () => {
    expect(hasWordCloudExport({})).toBe(false);
  });

  it("rejects an undefined export", () => {
    expect(hasWordCloudExport({ WordCloud: undefined })).toBe(false);
  });

  it("rejects null", () => {
    expect(hasWordCloudExport(null)).toBe(false);
  });

  it("rejects undefined", () => {
    expect(hasWordCloudExport(undefined)).toBe(false);
  });

  it("rejects a non-object resolution", () => {
    expect(hasWordCloudExport("WordCloud")).toBe(false);
  });
});
