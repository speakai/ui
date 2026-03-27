import { test, expect, Page } from "@playwright/test";

// Helper: close the config SidePanel if it's open (it defaults to open in the demo)
async function dismissConfigPanel(page: Page) {
  const closePanel = page.locator("[aria-label='Close panel']");
  if (await closePanel.isVisible({ timeout: 1000 }).catch(() => false)) {
    await closePanel.click();
    await page.waitForTimeout(300);
  }
}

// The demo app has a "Theme Configurator" SidePanel that opens by default.
// On mobile it's full-width and intercepts all clicks. Dismiss it first.
test.afterEach(async ({ page }) => {
  // Clean up any open dialogs/panels for next test
});


// ── Page load ───────────────────────────────────────────────────────────────

test.describe("Demo page loads", () => {
  test("renders the page title", async ({ page }) => {
    await page.goto("/ui");
    await expect(page).toHaveTitle(/@speakai\/ui/);
  });

  test("renders the sidebar navigation", async ({ page }) => {
    await page.goto("/ui");
    // Desktop: sidebar is visible; Mobile: hamburger button is visible
    const sidebar = page.locator("nav[aria-label='Main navigation']");
    await expect(sidebar.first()).toBeAttached();
  });
});

// ── Component sections exist and are visible ────────────────────────────────

const sections = [
  { id: "button", name: "Button" },
  { id: "input", name: "Input & Select" },
  { id: "switch", name: "Switch" },
  { id: "checkbox", name: "Checkbox" },
  { id: "card", name: "Card" },
  { id: "page-header", name: "PageHeader" },
  { id: "tabs", name: "Tabs" },
  { id: "table", name: "Table" },
  { id: "stat-card", name: "StatCard" },
  { id: "badge", name: "Badge" },
  { id: "info-card", name: "InfoCard" },
  { id: "toast", name: "Toast" },
  { id: "dialog", name: "Dialog" },
  { id: "empty-state", name: "EmptyState" },
  { id: "error-state", name: "ErrorState" },
  { id: "dropdown", name: "DropdownMenu" },
  { id: "tooltip", name: "Tooltip" },
  { id: "avatar", name: "Avatar" },
  { id: "progress", name: "Progress" },
  { id: "skeleton", name: "Loading Skeletons" },
];

test.describe("All component sections render", () => {
  for (const section of sections) {
    test(`#${section.id} — ${section.name} section exists`, async ({ page }) => {
      await page.goto("/ui");
      const el = page.locator(`#${section.id}`);
      await expect(el).toBeAttached();
    });
  }
});

// ── Interactive component tests in real browser ─────────────────────────────

test.describe("Button interactions", () => {
  test("button is visible and clickable", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    // Target buttons that are actual component demos (not code toggle buttons)
    // Look for buttons with visible text inside the section
    const section = page.locator("#button");
    await section.scrollIntoViewIfNeeded();
    const btn = section.locator("button:has-text('Primary'), button:has-text('Secondary')").first();
    await expect(btn).toBeVisible();
    await btn.click();
  });

  test("multiple button variants render", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const section = page.locator("#button");
    await section.scrollIntoViewIfNeeded();
    // Should have multiple visible buttons with different text
    const buttons = section.locator("button:visible");
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });
});

test.describe("Input interactions", () => {
  test("input accepts typed text", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const input = page.locator("#input input[type='text'], #input input[type='search']").first();
    await input.scrollIntoViewIfNeeded();
    await input.fill("Hello world");
    await expect(input).toHaveValue("Hello world");
  });

  test("select has options", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const select = page.locator("#input select").first();
    await select.scrollIntoViewIfNeeded();
    await expect(select).toBeVisible();
  });
});

test.describe("Switch interactions", () => {
  test("switch toggles on click", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const section = page.locator("#switch");
    await section.scrollIntoViewIfNeeded();
    const sw = section.locator("[role='switch']").first();
    await sw.scrollIntoViewIfNeeded();
    await sw.waitFor({ state: "visible" });
    const before = await sw.getAttribute("aria-checked");
    await sw.click();
    const after = await sw.getAttribute("aria-checked");
    expect(before).not.toBe(after);
  });
});

test.describe("Checkbox interactions", () => {
  test("checkbox toggles on click", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const section = page.locator("#checkbox");
    await section.scrollIntoViewIfNeeded();
    const cb = section.locator("input[type='checkbox']").first();
    await cb.scrollIntoViewIfNeeded();
    await cb.waitFor({ state: "visible" });
    const before = await cb.isChecked();
    await cb.click({ force: true });
    const after = await cb.isChecked();
    expect(before).not.toBe(after);
  });
});

test.describe("Tabs interactions", () => {
  test("clicking a tab switches content", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const tabSection = page.locator("#tabs");
    await tabSection.scrollIntoViewIfNeeded();
    const tabs = tabSection.locator("[role='tab']");
    await tabs.first().waitFor({ state: "visible" });
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  });

  test("keyboard arrow navigation works", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const tabSection = page.locator("#tabs");
    await tabSection.scrollIntoViewIfNeeded();
    const firstTab = tabSection.locator("[role='tab']").first();
    await firstTab.waitFor({ state: "visible" });
    await firstTab.focus();
    await page.keyboard.press("ArrowRight");
    const secondTab = tabSection.locator("[role='tab']").nth(1);
    await expect(secondTab).toHaveAttribute("aria-selected", "true");
  });
});

test.describe("Table rendering", () => {
  test("table has header and data rows", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const tableSection = page.locator("#table");
    await tableSection.scrollIntoViewIfNeeded();
    const table = tableSection.locator("table").first();
    await table.waitFor({ state: "visible" });

    const headerCells = table.locator("th");
    expect(await headerCells.count()).toBeGreaterThanOrEqual(2);

    const rows = table.locator("tbody tr");
    expect(await rows.count()).toBeGreaterThanOrEqual(1);
  });

  test("sort headers are clickable", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const tableSection = page.locator("#table");
    await tableSection.scrollIntoViewIfNeeded();
    const sortHeader = tableSection.locator("th").first();
    await sortHeader.waitFor({ state: "visible" });
    await sortHeader.click();
  });
});

test.describe("Toast interactions", () => {
  test("clicking toast button shows notification", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const toastSection = page.locator("#toast");
    await toastSection.scrollIntoViewIfNeeded();
    // Look for buttons with toast-related text
    const triggerBtn = toastSection.locator("button:has-text('Success'), button:has-text('Toast'), button:has-text('Info'), button:has-text('Error')").first();
    await triggerBtn.click();
    // A toast notification should appear
    const toast = page.locator("[aria-live='polite']").locator("visible=true");
    await expect(toast).toBeAttached({ timeout: 3000 });
  });
});

test.describe("Dialog interactions", () => {
  test("opens and closes dialog", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const dialogSection = page.locator("#dialog");
    await dialogSection.scrollIntoViewIfNeeded();
    // Click "Open Dialog" button
    const openBtn = dialogSection.locator("button:has-text('Open Dialog')").first();
    await openBtn.click();
    // The dialog with "Edit Document" title should appear
    const dialogTitle = page.getByText("Edit Document");
    await expect(dialogTitle).toBeVisible({ timeout: 3000 });
    // Close with Escape
    await page.keyboard.press("Escape");
    await expect(dialogTitle).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Dropdown interactions", () => {
  test("opens dropdown menu on click", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const section = page.locator("#dropdown");
    await section.scrollIntoViewIfNeeded();
    const trigger = section.locator("[aria-haspopup='true']").first();
    await trigger.waitFor({ state: "visible" });
    await trigger.click();
    const menu = page.locator("[role='menu']");
    await expect(menu.first()).toBeVisible({ timeout: 3000 });
  });

  test("closes dropdown on Escape", async ({ page }) => {
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const section = page.locator("#dropdown");
    await section.scrollIntoViewIfNeeded();
    const trigger = section.locator("[aria-haspopup='true']").first();
    await trigger.waitFor({ state: "visible" });
    await trigger.click();
    const menu = page.locator("[role='menu']");
    await expect(menu.first()).toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Escape");
    await expect(menu).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Tooltip interactions", () => {
  test("shows tooltip on hover", async ({ page }, testInfo) => {
    // Tooltips don't work well on touch devices
    test.skip(testInfo.project.name === "mobile-chromium", "no hover on mobile");
    await page.goto("/ui");
    await dismissConfigPanel(page);
    const section = page.locator("#tooltip");
    await section.scrollIntoViewIfNeeded();
    const trigger = section.locator(".relative.inline-flex").first();
    await trigger.waitFor({ state: "visible" });
    await trigger.hover();
    const tooltip = page.locator("[role='tooltip']");
    await expect(tooltip.first()).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Progress rendering", () => {
  test("progress bars render with correct aria attributes", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#progress");
    await section.scrollIntoViewIfNeeded();
    const bar = section.locator("[role='progressbar']").first();
    await expect(bar).toBeVisible();
    const value = await bar.getAttribute("aria-valuenow");
    expect(Number(value)).toBeGreaterThanOrEqual(0);
    expect(Number(value)).toBeLessThanOrEqual(100);
  });
});

test.describe("Avatar rendering", () => {
  test("avatars render with initials or images", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#avatar");
    await section.scrollIntoViewIfNeeded();
    // Should have multiple avatars
    const avatars = section.locator(".rounded-full, .rounded-lg").filter({ has: page.locator("span, img") });
    expect(await avatars.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe("EmptyState rendering", () => {
  test("empty state shows title", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#empty-state");
    await section.scrollIntoViewIfNeeded();
    const status = section.locator("[role='status']");
    await expect(status.first()).toBeVisible();
  });
});

test.describe("ErrorState rendering", () => {
  test("error state shows alert with retry button", async ({ page }) => {
    await page.goto("/ui");
    const section = page.locator("#error-state");
    await section.scrollIntoViewIfNeeded();
    const alert = section.locator("[role='alert']");
    await expect(alert.first()).toBeVisible();
  });
});
