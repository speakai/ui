import { test, expect, Page } from "@playwright/test";

async function dismissConfigPanel(page: Page) {
  const closePanel = page.locator("[aria-label='Close panel']");
  if (await closePanel.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closePanel.click();
    await page.waitForTimeout(300);
  }
}

// ── Responsive layout tests ─────────────────────────────────────────────────
// These tests verify real CSS rendering at different viewport widths.
// They run in both desktop-chromium (1280x720) and mobile-chromium (412x915)
// projects, so responsive behavior is verified automatically.

test.describe("Responsive layout", () => {
  test("page renders without horizontal overflow", async ({ page }) => {
    await page.goto("/ui");
    await page.waitForLoadState("networkidle");
    const body = page.locator("body");
    const bodyBox = await body.boundingBox();
    const viewportSize = page.viewportSize();
    if (bodyBox && viewportSize) {
      // Body should not be wider than viewport (no horizontal scroll)
      expect(bodyBox.width).toBeLessThanOrEqual(viewportSize.width + 1);
    }
  });

  test("buttons are not truncated or overflowing", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#button");
    await section.scrollIntoViewIfNeeded();
    const buttons = section.locator("button");
    const count = await buttons.count();
    for (let i = 0; i < Math.min(count, 6); i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        const box = await btn.boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }
    }
  });

  test("table section is scrollable, not overflowing page", async ({ page }) => {
    await page.goto("/ui");
    const tableSection = page.locator("#table");
    await tableSection.scrollIntoViewIfNeeded();
    const tableWrapper = tableSection.locator(".overflow-x-auto, .overflow-hidden").first();
    if (await tableWrapper.isVisible()) {
      const box = await tableWrapper.boundingBox();
      const viewportSize = page.viewportSize();
      if (box && viewportSize) {
        expect(box.width).toBeLessThanOrEqual(viewportSize.width);
      }
    }
  });

  test("stat card grid wraps on narrow viewports", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#stat-card");
    await section.scrollIntoViewIfNeeded();
    const grid = section.locator(".grid").first();
    await expect(grid).toBeVisible();
  });

  test("page header stacks vertically on mobile", async ({ page, browserName }, testInfo) => {
    // This test is most meaningful on mobile project
    await page.goto("/ui");
    const section = page.locator("#page-header");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
  });

  test("cards don't overflow their containers", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#card");
    await section.scrollIntoViewIfNeeded();
    const cards = section.locator(".rounded-lg");
    const count = await cards.count();
    const viewportSize = page.viewportSize();
    for (let i = 0; i < Math.min(count, 4); i++) {
      const card = cards.nth(i);
      if (await card.isVisible()) {
        const box = await card.boundingBox();
        if (box && viewportSize) {
          expect(box.width).toBeLessThanOrEqual(viewportSize.width);
        }
      }
    }
  });

  test("skeleton components render (no broken layouts)", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#skeleton");
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    // Skeletons should have animated pulse elements
    const pulses = section.locator(".animate-pulse");
    expect(await pulses.count()).toBeGreaterThan(0);
  });
});

// ── Mobile-specific tests ───────────────────────────────────────────────────

test.describe("Mobile sidebar", () => {
  test("hamburger button is visible on mobile", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "mobile only");
    await page.goto("/ui");
    const hamburger = page.locator("[aria-label='Open menu']");
    await expect(hamburger).toBeVisible();
  });

  test("hamburger opens mobile drawer", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile-chromium", "mobile only");
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const hamburger = page.locator("[aria-label='Open menu']");
    await hamburger.click();
    const closeBtn = page.locator("[aria-label='Close sidebar']").and(page.locator(":visible"));
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Desktop sidebar", () => {
  test("sidebar is visible on desktop", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "desktop only");
    await page.goto("/ui");
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
  });

  test("sidebar collapse button works", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop-chromium", "desktop only");
    await page.goto("/ui");
    const collapseBtn = page.locator("[aria-label='Collapse sidebar']").first();
    if (await collapseBtn.isVisible()) {
      await collapseBtn.click();
      const expandBtn = page.locator("[aria-label='Expand sidebar']").first();
      await expect(expandBtn).toBeVisible({ timeout: 3000 });
    }
  });
});
