import { defineConfig } from "tsup";
import { copyFileSync, readFileSync, writeFileSync, readdirSync } from "fs";
import { join } from "path";

export default defineConfig({
  entry: ["src/index.ts", "src/media.ts", "src/transcript.ts"],
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

    // Prepend "use client" to all JS/MJS files in dist
    const distDir = "dist";
    const files = readdirSync(distDir).filter(
      (f) => f.endsWith(".js") || f.endsWith(".mjs")
    );
    for (const file of files) {
      const filePath = join(distDir, file);
      const content = readFileSync(filePath, "utf-8");
      if (!content.startsWith('"use client"')) {
        writeFileSync(filePath, `"use client";\n${content}`);
      }
    }

    console.log("CSS copied + 'use client' prepended");
  },
});
