import type { Config } from "tailwindcss";
import uiConfig from "../packages/ui/tailwind.config";

const config: Config = {
  ...uiConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "../packages/ui/src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
};

export default config;
