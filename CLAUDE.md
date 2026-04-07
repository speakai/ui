# @speakai/ui — Claude Instructions

## Project Overview

React + Tailwind component library published as `@speakai/ui`. Built with tsup, outputs CJS + ESM + .d.ts.

## Build & Test

```bash
npm run build        # tsup build + postbuild safelist generation
npm run typecheck    # tsc --noEmit
npm run test         # vitest
npm run demo:build   # Next.js demo site
```

## Sub-path Exports Architecture

Every component has a dedicated sub-path export so consumers can import only what they need:

```ts
import { Button } from "@speakai/ui/button";   // pulls only button + shared chunks
import { Button } from "@speakai/ui";           // pulls entire barrel (legacy)
```

### When adding a new component

Follow these steps **every time** a new component is added to `src/components/`:

1. **Create the component** in `src/components/MyComponent.tsx`

2. **Create an entry file** at `src/entries/<kebab-case>.ts`:
   ```ts
   export { MyComponent } from "../components/MyComponent";
   export type { MyComponentProps } from "../components/MyComponent";
   ```
   Naming: PascalCase file → kebab-case entry (e.g., `StatCard.tsx` → `stat-card.ts`, `SidePanel.tsx` → `side-panel.ts`)

3. **Add to `src/index.ts`** barrel (for backward compatibility):
   ```ts
   export { MyComponent } from "./components/MyComponent";
   export type { MyComponentProps } from "./components/MyComponent";
   ```

4. **Add to `tsup.config.ts`** entry array:
   ```ts
   "src/entries/my-component.ts",
   ```
   Keep entries sorted alphabetically.

5. **Add to `package.json` exports map**:
   ```json
   "./my-component": {
     "types": "./dist/entries/my-component.d.ts",
     "import": "./dist/entries/my-component.mjs",
     "require": "./dist/entries/my-component.js"
   }
   ```

6. **Add to `package.json` typesVersions** (for older TS resolvers):
   ```json
   "my-component": ["dist/entries/my-component.d.ts"]
   ```

7. **Update README.md** — add the sub-path to the "All available sub-paths" table in the Setup section and the Quick Reference imports.

8. **Verify**: `npm run build && npm run typecheck`

### Exceptions

- `MediaPlayer` and `useMediaSync` live at `./media` (via `src/media.ts`) — they require prosemirror peer deps.
- `TranscriptView` lives at `./transcript` (via `src/transcript.ts`).
- `cn` utility lives at `./cn` (via `src/entries/cn.ts`).

### Key files

- `tsup.config.ts` — build config with all entry points; `onSuccess` copies CSS and prepends `"use client"` recursively
- `package.json` — `exports` map and `typesVersions` define all sub-paths
- `src/entries/` — one file per component, re-exports from `src/components/`
- `src/index.ts` — barrel export (backward compat, do not remove)

## Code Conventions

- All colors use CSS variable tokens (`text-foreground`, `bg-primary`), never hardcoded Tailwind colors
- Class-based dark mode (`.dark` on `<html>`)
- All components accept `className` prop and use `cn()` for class merging
- External deps: react, react-dom, prosemirror-* are marked external in tsup
- `"use client"` is auto-prepended to all built JS/MJS files
