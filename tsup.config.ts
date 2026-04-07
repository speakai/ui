import { defineConfig } from "tsup";
import { copyFileSync, readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/media.ts",
    "src/transcript.ts",
    // Per-component entries
    "src/entries/accordion.ts",
    "src/entries/auth-card.ts",
    "src/entries/auth-divider.ts",
    "src/entries/avatar.ts",
    "src/entries/badge.ts",
    "src/entries/bottom-sheet.ts",
    "src/entries/breadcrumb.ts",
    "src/entries/button.ts",
    "src/entries/card.ts",
    "src/entries/checkbox.ts",
    "src/entries/chips.ts",
    "src/entries/cn.ts",
    "src/entries/color-picker.ts",
    "src/entries/confirm-dialog.ts",
    "src/entries/date-picker.ts",
    "src/entries/dialog.ts",
    "src/entries/dropdown-menu.ts",
    "src/entries/empty-state.ts",
    "src/entries/error-state.ts",
    "src/entries/file-dropzone.ts",
    "src/entries/image-uploader.ts",
    "src/entries/info-card.ts",
    "src/entries/input.ts",
    "src/entries/language-selector.ts",
    "src/entries/otp-input.ts",
    "src/entries/page-header.ts",
    "src/entries/password-input.ts",
    "src/entries/phone-input.ts",
    "src/entries/popover.ts",
    "src/entries/progress.ts",
    "src/entries/radio-group.ts",
    "src/entries/side-panel.ts",
    "src/entries/sidebar.ts",
    "src/entries/skeleton.ts",
    "src/entries/slider.ts",
    "src/entries/sso-button.ts",
    "src/entries/stat-card.ts",
    "src/entries/stepper.ts",
    "src/entries/switch.ts",
    "src/entries/table.ts",
    "src/entries/tabs.ts",
    "src/entries/theme-toggle.ts",
    "src/entries/time-picker.ts",
    "src/entries/toast.ts",
    "src/entries/tooltip.ts",
  ],
  format: ["cjs", "esm"],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  external: ["react", "react-dom", /^prosemirror-/],
  treeshake: true,
  tsconfig: "tsconfig.build.json",
  onSuccess: async () => {
    // Copy CSS
    copyFileSync("src/styles/globals.css", "dist/styles.css");

    // Prepend "use client" to all JS/MJS files in dist (recursively)
    function prependUseClient(dir: string) {
      const items = readdirSync(dir);
      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          prependUseClient(fullPath);
        } else if (item.endsWith(".js") || item.endsWith(".mjs")) {
          const content = readFileSync(fullPath, "utf-8");
          if (!content.startsWith('"use client"')) {
            writeFileSync(fullPath, `"use client";\n${content}`);
          }
        }
      }
    }
    prependUseClient("dist");

    console.log("CSS copied + 'use client' prepended");
  },
});
