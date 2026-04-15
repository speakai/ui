import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Safelist Integrity Test ──────────────────────────────────────────────────
// This test directly catches the root cause of the v0.11.0 regression:
// generate-safelist.mjs only scanned dist/index.mjs (a pure re-export barrel
// after splitting:true was added), so the @source inline(...) block collapsed
// from ~471 classes to 9. The fix scans all dist/*.mjs chunk files.
//
// If this test fails with "safelist has fewer than 200 classes", the safelist
// script has regressed and critical classes will be missing from compiled CSS.

const __dirname = dirname(fileURLToPath(import.meta.url));

function readSafelist(): string {
  const cssPath = resolve(__dirname, "../dist/styles.css");
  const css = readFileSync(cssPath, "utf-8");

  // Extract the content inside @source inline("...")
  const match = css.match(/@source inline\("([^"]+)"\)/);
  if (!match) {
    throw new Error(
      'Could not find @source inline("...") block in dist/styles.css. ' +
      "Run the build (npm run build) to regenerate the safelist."
    );
  }
  return match[1];
}

describe("Safelist integrity (dist/styles.css)", () => {
  it("safelist has at least 200 classes (guards against near-empty safelist)", () => {
    const safelist = readSafelist();
    const classes = safelist.trim().split(/\s+/);
    expect(classes.length).toBeGreaterThanOrEqual(200);
  });

  const criticalClasses = [
    "bg-danger/10",
    "bg-success/10",
    "bg-warning/10",
    "bg-info/10",
    "text-danger-foreground",
    "hover:bg-danger/90",
  ] as const;

  it.each(criticalClasses)(
    'safelist contains critical class "%s"',
    (cls) => {
      const safelist = readSafelist();
      // Split on whitespace and check for exact class membership
      const classes = new Set(safelist.trim().split(/\s+/));
      expect(classes.has(cls)).toBe(true);
    }
  );
});
