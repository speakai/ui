import { existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// In CI a missing build throws instead of skipping, so dist guards cannot pass while checking nothing.
export function isBuilt(relPath: string): boolean {
  const built = existsSync(resolve(ROOT, relPath));
  if (!built && process.env.CI) {
    throw new Error(`${relPath} is missing: CI must run "npm run build" before "npm run test".`);
  }
  return built;
}
