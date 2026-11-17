import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Error and helper text uses --color-danger-text. WCAG AA asks for 4.5:1 for
// small text, so check it against every surface such text sits on, in both modes.

const CSS_FILE = resolve(dirname(fileURLToPath(import.meta.url)), "../src/styles/globals.css");
const SURFACES = ["--color-background", "--color-card", "--color-popover"];

function tokens(block: ":root" | ".dark"): Record<string, string> {
  const css = readFileSync(CSS_FILE, "utf-8");
  const start = css.indexOf(`\n${block} {`);
  const body = css.slice(start, css.indexOf("\n}", start));
  const out: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) out[name] = value.trim();
  return out;
}

function toRgb(value: string): [number, number, number] {
  const hex = /^#([0-9a-f]{6})$/i.exec(value);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as [number, number, number];
  const hsl = /^hsl\(([\d.]+) ([\d.]+)% ([\d.]+)%\)$/.exec(value);
  if (!hsl) throw new Error(`Unsupported colour: ${value}`);
  const [h, s, l] = [Number(hsl[1]), Number(hsl[2]) / 100, Number(hsl[3]) / 100];
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255);
  };
  return [channel(0), channel(8), channel(4)];
}

function luminance(rgb: [number, number, number]) {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(toRgb(a)), luminance(toRgb(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("--color-danger-text contrast", () => {
  const cases = ([":root", ".dark"] as const).flatMap((block) => {
    const t = tokens(block);
    return SURFACES.map((surface) => [block, surface, t["--color-danger-text"], t[surface]] as const);
  });

  it.each(cases)("%s on %s is at least 4.5:1", (_block, _surface, text, surface) => {
    expect(text).toBeDefined();
    expect(contrast(text, surface)).toBeGreaterThanOrEqual(4.5);
  });
});
