import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,

  use: {
    // Demo is served from a temp dir with /ui/ symlink to match Next.js basePath
    baseURL: "http://localhost:5555",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],

  webServer: {
    // On CI, lib + demo are pre-built by the workflow — just serve. Locally, build everything.
    command: process.env.CI
      ? "rm -rf /tmp/speakui-serve && mkdir -p /tmp/speakui-serve && ln -sf \"$(pwd)/demo/out\" /tmp/speakui-serve/ui && npx serve /tmp/speakui-serve -l 5555"
      : "npm run build && cd demo && npm install && npm run build && rm -rf /tmp/speakui-serve && mkdir -p /tmp/speakui-serve && ln -sf \"$(pwd)/out\" /tmp/speakui-serve/ui && npx serve /tmp/speakui-serve -l 5555",
    url: "http://localhost:5555/ui",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
