import { describe, it, expect } from "vitest";
import { DEFAULT_STAT_METRICS, resolveStatMetrics } from "../../../src/components/dashboards/stat-metrics";
import {
  DEFAULT_COMPARISON_METRICS,
  resolveComparisonMetrics,
  resolveSnapshotMetrics,
} from "../../../src/components/dashboards/snapshot-metrics";

const prototypeKeys = ["toString", "constructor", "hasOwnProperty", "__proto__", "valueOf"];

describe("metric key resolvers", () => {
  it("drop object prototype names, which are not metric keys", () => {
    expect(resolveStatMetrics([...prototypeKeys, "words"])).toEqual(["words"]);
    expect(resolveStatMetrics(prototypeKeys)).toEqual(DEFAULT_STAT_METRICS);
    expect(resolveSnapshotMetrics([...prototypeKeys, "totalWords"])).toEqual(["totalWords"]);
    expect(resolveComparisonMetrics(prototypeKeys)).toEqual(DEFAULT_COMPARISON_METRICS);
  });
});
