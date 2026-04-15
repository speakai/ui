import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── Safelist Integrity Test ──────────────────────────────────────────────────
// This test directly catches the root cause of the v0.11.0 regression:
// generate-safelist.mjs only scanned dist/index.mjs (a pure re-export barrel
// after splitting:true was added), so the @source inline(...) block collapsed
// from ~471 classes to 9. The fix scans all dist/*.mjs chunk files.
//
// These tests require a prior `npm run build` to populate dist/styles.css.
// They are skipped automatically when dist/ does not exist (e.g. clean CI
// runs that only execute `npm test` without a build step).
//
// To validate the safelist locally: `npm run build && npm run test`

const __dirname = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = resolve(__dirname, "../dist/styles.css");
const distExists = existsSync(CSS_PATH);

function readSafelist(): string {
  const css = readFileSync(CSS_PATH, "utf-8");

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
  it.skipIf(!distExists)("safelist has at least 200 classes (guards against near-empty safelist)", () => {
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
      if (!distExists) return;
      const safelist = readSafelist();
      // Split on whitespace and check for exact class membership
      const classes = new Set(safelist.trim().split(/\s+/));
      expect(classes.has(cls)).toBe(true);
    }
  );
});
