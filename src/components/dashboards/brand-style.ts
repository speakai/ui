/**
 * Brand styling helpers for dashboard widgets.
 *
 * Charts read their primary series/accent color from `--color-chart-1`. Setting
 * that CSS variable on a scoped wrapper's inline `style` cascades it only to the
 * charts inside and never leaks to the rest of the app. Background/foreground/
 * surface tokens are left untouched so dark mode and text contrast stay correct.
 *
 * Pure functions only — shared so the builder and the public view brand
 * widgets identically.
 */

import type { CSSProperties } from "react";

const HEX_COLOR_REGEX = /^#(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/** True when `value` is a valid 3- or 6-digit hex color (e.g. `#222`, `#6366F1`). */
export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === "string" && HEX_COLOR_REGEX.test(value);
}

/** Expand a 3-digit shorthand hex (`#222`) to its 6-digit form (`#222222`). */
export function expandHex(value: string): string {
  if (/^#[0-9A-Fa-f]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return value;
}

/** sRGB channels (0–255) parsed from a valid 3- or 6-digit hex. */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const full = expandHex(hex).slice(1);
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  const hex = (n: number) => clamp(n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** WCAG relative luminance (0 = black, 1 = white) from sRGB channels. */
function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two relative-luminance values. */
function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const LIGHT_SURFACE_LUMINANCE = relativeLuminance({ r: 255, g: 255, b: 255 });
const DARK_SURFACE_LUMINANCE = relativeLuminance({ r: 24, g: 24, b: 27 });

/** Minimum contrast for large fills / bars (WCAG large-text / graphics tier). */
const MIN_CONTRAST = 3;

/**
 * Adjust a brand hex so it stays visible on the current theme's card surface.
 * In dark mode the color is lightened toward white; in light mode it's darkened
 * toward black — until it clears `MIN_CONTRAST` (~3:1) against the card surface.
 * Hue is preserved; a color that already passes is returned unchanged.
 */
export function adjustBrandColorForTheme(hex: string, isDark: boolean): string {
  const surface = isDark ? DARK_SURFACE_LUMINANCE : LIGHT_SURFACE_LUMINANCE;
  let { r, g, b } = hexToRgb(hex);

  if (contrastRatio(relativeLuminance({ r, g, b }), surface) >= MIN_CONTRAST) {
    return rgbToHex(r, g, b);
  }

  const target = isDark ? 255 : 0;
  for (let step = 0; step < 20; step++) {
    r += (target - r) * 0.1;
    g += (target - g) * 0.1;
    b += (target - b) * 0.1;
    if (contrastRatio(relativeLuminance({ r, g, b }), surface) >= MIN_CONTRAST) {
      break;
    }
  }
  return rgbToHex(r, g, b);
}

/**
 * Build an inline `style` object that overrides the chart accent color for
 * everything rendered inside the wrapper. Invalid/missing colors are ignored so
 * the app default `--color-chart-1` remains in force. The stored hex is the
 * brand INTENT; the value written to the CSS var is a theme-adjusted RENDER value.
 */
export function brandStyle(accentColor?: string | null, isDark = false): CSSProperties {
  const style: Record<string, string> = {};
  if (isHexColor(accentColor)) {
    style["--color-chart-1"] = adjustBrandColorForTheme(accentColor, isDark);
  }
  return style as CSSProperties;
}

/** Build an inline `style` object that applies the brand font family. */
export function brandFontStyle(fontFamily?: string | null): CSSProperties {
  return fontFamily ? { fontFamily } : {};
}
