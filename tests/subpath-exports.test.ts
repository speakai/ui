import { describe, it, expect } from "vitest";
import { existsSync } from "fs";
import { createRequire } from "module";
import { resolve } from "path";
import { pathToFileURL } from "url";
import pkg from "../package.json";
import { ROOT, isBuilt } from "./dist";

// v0.11.0 regression: tsup splitting shipped badge, button and table entries with no exports, so check dist.

type Target = { types: string; import: string; require: string };
const entries = Object.entries(pkg.exports).filter(
  (e): e is [string, Target] => typeof e[1] === "object",
);
const requireDist = createRequire(resolve(ROOT, "package.json"));

describe.skipIf(!isBuilt("dist/index.mjs"))("package.json sub-path exports (dist)", () => {
  it.each(entries)("%s points at built types, ESM and CJS files", (_path, target) => {
    for (const file of [target.types, target.import, target.require]) {
      expect(existsSync(resolve(ROOT, file)), file).toBe(true);
    }
  });

  it.each(entries)("%s exports the same non-empty members from ESM and CJS", async (_path, target) => {
    const esm = await import(pathToFileURL(resolve(ROOT, target.import)).href);
    const cjs = requireDist(resolve(ROOT, target.require));
    const esmNames = Object.keys(esm).filter((k) => k !== "default").sort();
    expect(esmNames.length).toBeGreaterThan(0);
    expect(Object.keys(cjs).sort()).toEqual(esmNames);
  });

  it.each([
    ["./badge", ["Badge", "StatusBadge"]],
    ["./button", ["Button"]],
    ["./table", ["Table", "TableSortHead", "useSort"]],
  ])("%s still exports the members that went missing in v0.11.0", async (path, names) => {
    const target = Object.fromEntries(entries)[path];
    const mod = await import(pathToFileURL(resolve(ROOT, target.import)).href);
    for (const name of names) expect(mod[name], name).toBeTruthy();
  });
});
