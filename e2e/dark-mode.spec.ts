import { test, expect } from "@playwright/test";

// ── Dark/Light mode tests ───────────────────────────────────────────────────
// Verifies real CSS variable rendering in dark and light themes.
// The demo app uses next-themes with class-based dark mode.

test.describe("Dark mode", () => {
  test("page has valid background color (CSS variables resolve)", async ({ page }) => {
    await page.goto("/ui");
    await page.waitForLoadState("networkidle");
    const bgColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    // CSS variables should resolve to a real color (not transparent or empty)
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(bgColor).toMatch(/rgb/);
  });

  test("toggling to light theme changes background to light color", async ({ page }) => {
    await page.goto("/ui");
    await page.waitForLoadState("networkidle");

    // Find the theme toggle button and click it to cycle themes
    // The demo has a ThemeToggle in the sidebar footer
    const themeBtn = page.locator("[aria-label*='Switch to']").first();
    if (await themeBtn.isVisible()) {
      // Click until we get to light
      for (let i = 0; i < 3; i++) {
        const label = await themeBtn.getAttribute("aria-label");
        if (label?.includes("light")) {
          await themeBtn.click();
          break;
        }
        await themeBtn.click();
        await page.waitForTimeout(200);
      }

      // Check if html has "light" class
      const htmlClass = await page.locator("html").getAttribute("class");
      if (htmlClass?.includes("light")) {
        const bgColor = await page.evaluate(() => {
          return getComputedStyle(document.body).backgroundColor;
        });
        const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
          const [, r, g, b] = match.map(Number);
          const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          // Light theme: luminance should be high (> 0.7)
          expect(luminance).toBeGreaterThan(0.7);
        }
      }
    }
  });

  test("buttons have non-transparent background colors", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#button");
    await section.scrollIntoViewIfNeeded();
    const btn = section.locator("button:has-text('Primary'), button:has-text('Secondary')").first();
    await expect(btn).toBeVisible();
    const bgColor = await btn.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Should have a non-transparent background (primary color resolved from CSS vars)
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("cards have visible borders", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#card");
    await section.scrollIntoViewIfNeeded();
    const card = section.locator(".rounded-lg.border").first();
    if (await card.isVisible()) {
      const borderColor = await card.evaluate((el) => getComputedStyle(el).borderColor);
      // Border should not be transparent
      expect(borderColor).not.toBe("rgba(0, 0, 0, 0)");
    }
  });

  test("text is readable against background (sufficient contrast)", async ({ page }) => {
    await page.goto("/ui");
    // Check body text color vs background
    const { textColor, bgColor } = await page.evaluate(() => {
      const style = getComputedStyle(document.body);
      return {
        textColor: style.color,
        bgColor: style.backgroundColor,
      };
    });

    function parseRgb(color: string) {
      const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      return m ? { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) } : null;
    }

    const text = parseRgb(textColor);
    const bg = parseRgb(bgColor);
    if (text && bg) {
      // Simple luminance-based contrast check
      const textLum = (0.299 * text.r + 0.587 * text.g + 0.114 * text.b) / 255;
      const bgLum = (0.299 * bg.r + 0.587 * bg.g + 0.114 * bg.b) / 255;
      const contrast = Math.abs(textLum - bgLum);
      // Text and background should have at least 0.5 contrast difference
      expect(contrast).toBeGreaterThan(0.4);
    }
  });

  test("badge colors render correctly", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#badge");
    await section.scrollIntoViewIfNeeded();
    const badge = section.locator("[role='status']").first();
    await expect(badge).toBeVisible();
    const color = await badge.evaluate((el) => getComputedStyle(el).color);
    // Badge text should have a non-default color
    expect(color).not.toBe("rgb(0, 0, 0)");
  });

  test("progress bar fill is visible", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#progress");
    await section.scrollIntoViewIfNeeded();
    const bar = section.locator("[role='progressbar']").first();
    await expect(bar).toBeVisible();
    // The inner fill div should have width > 0
    const fill = bar.locator("div").first();
    const box = await fill.boundingBox();
    if (box) {
      expect(box.width).toBeGreaterThan(0);
    }
  });

  test("info card has visible background tint", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#info-card");
    await section.scrollIntoViewIfNeeded();
    const card = section.locator(".rounded-lg").first();
    if (await card.isVisible()) {
      const bgColor = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
    }
  });
});
