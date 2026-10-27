import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { ACCENT_PRESETS, COLOR_TOKENS, DEFAULT_ACCENT_ID } from "@speakai/shared";

const CSS_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles/globals.css");
const MARKED_LINE = /^\s*(--[\w-]+):\s*([^;]+);\s*\/\* shared: (color|accent)\.(\w+) \*\/$/;
const BLOCK_START = /^(:root|\.dark) \{$/;

type Mode = "light" | "dark";

function markedValues() {
  const rows: { mode: Mode; variable: string; value: string; group: string; name: string }[] = [];
  let mode: Mode | null = null;
  for (const line of readFileSync(CSS_FILE, "utf-8").split("\n")) {
    const block = BLOCK_START.exec(line);
    if (block) {
      mode = block[1] === ".dark" ? "dark" : "light";
      continue;
    }
    if (line === "}") {
      mode = null;
      continue;
    }
    const marked = MARKED_LINE.exec(line);
    if (marked && mode) rows.push({ mode, variable: marked[1], value: marked[2].trim(), group: marked[3], name: marked[4] });
  }
  return rows;
}

describe("globals.css colours marked `shared:` match @speakai/shared", () => {
  const defaultAccent = ACCENT_PRESETS.find((preset) => preset.id === DEFAULT_ACCENT_ID);
  const rows = markedValues();

  it("finds the marked colours in both modes", () => {
    expect(rows.filter((row) => row.mode === "light").length).toBeGreaterThan(0);
    expect(rows.filter((row) => row.mode === "dark").length).toBeGreaterThan(0);
  });

  it.each(rows.map((row) => [`${row.mode} ${row.variable}`, row] as const))("%s", (_label, row) => {
    const source = row.group === "color" ? COLOR_TOKENS[row.mode] : defaultAccent?.[row.mode];
    expect(row.value.toLowerCase()).toBe(String((source as Record<string, string>)[row.name]).toLowerCase());
  });
});
