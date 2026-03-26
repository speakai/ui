import type { Config } from "tailwindcss";
import uiConfig from "../tailwind.config";

const config: Config = {
  ...uiConfig,
  content: [
    "./app/**/*.{ts,tsx}",
    "../src/**/*.{ts,tsx}",
  ],
  darkMode: "class",
};

export default config;
