#!/usr/bin/env node
/**
 * Writes @speakai/shared design token values into the globals.css lines marked
 * `/* shared: color.<token> *\/` or `/* shared: accent.<field> *\/`, using the
 * light values inside `:root` and the dark values inside `.dark`.
 * Runs automatically via the prebuild hook.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ACCENT_PRESETS, COLOR_TOKENS, DEFAULT_ACCENT_ID } from "@speakai/shared";

const CSS_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles/globals.css");
const MARKED_LINE = /^(\s*--[\w-]+:\s*)[^;]+(;\s*\/\* shared: (color|accent)\.(\w+) \*\/)$/;
const BLOCK_START = /^(:root|\.dark) \{$/;

const defaultAccent = ACCENT_PRESETS.find((preset) => preset.id === DEFAULT_ACCENT_ID);
let mode = null;
let synced = 0;

const css = readFileSync(CSS_FILE, "utf-8")
  .split("\n")
  .map((line) => {
    const block = BLOCK_START.exec(line);
    if (block) {
      mode = block[1] === ".dark" ? "dark" : "light";
      return line;
    }
    if (line === "}") {
      mode = null;
      return line;
    }
    const marked = MARKED_LINE.exec(line);
    if (!marked) return line;
    if (!mode) throw new Error(`Shared token marker outside :root or .dark: ${line.trim()}`);
    const [, declaration, marker, group, name] = marked;
    const value = (group === "color" ? COLOR_TOKENS[mode] : defaultAccent[mode])[name];
    if (typeof value !== "string") throw new Error(`Unknown shared token ${group}.${name}`);
    synced += 1;
    return `${declaration}${value}${marker}`;
  })
  .join("\n");

writeFileSync(CSS_FILE, css);
console.log(`Synced ${synced} colour values from @speakai/shared into globals.css`);
