import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import { ROOT, isBuilt } from "./dist";

// v0.11.0 regression: the safelist scanned only the dist barrel and collapsed from ~471 classes to 9.

const CSS = "dist/styles.css";

function readSafelist(): Set<string> {
  const css = readFileSync(resolve(ROOT, CSS), "utf-8");
  const match = css.match(/@source inline\("([^"]+)"\)/);
  if (!match) throw new Error('No @source inline("...") block in dist/styles.css; rebuild with npm run build.');
  return new Set(match[1].trim().split(/\s+/));
}

describe.skipIf(!isBuilt(CSS))("Safelist integrity (dist/styles.css)", () => {
  it("safelist has at least 200 classes (guards against near-empty safelist)", () => {
    expect(readSafelist().size).toBeGreaterThanOrEqual(200);
  });

  it.each([
    "bg-danger/10",
    "bg-success/10",
    "bg-warning/10",
    "bg-info/10",
    "text-danger-foreground",
    "hover:bg-danger/90",
  ])('safelist contains critical class "%s"', (cls) => {
    expect(readSafelist().has(cls)).toBe(true);
  });
});
