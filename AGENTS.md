# @speakai/ui

A React + Tailwind v4 component library published to npm as `@speakai/ui`. tsup builds it into
CJS, ESM and `.d.ts` files in `dist/`. This repo is public: keep internal hostnames,
credentials, customer data and private links out of every file, commit and PR.

## Layout

- `src/components/`: one file per component (`Button.tsx`). Charts live in
  `src/components/charts/` and dashboard widgets in `src/components/dashboards/`; those files are
  kebab-case.
- `src/entries/`: one file per sub-path export, re-exporting from `src/components/`.
- `src/index.ts`: the root barrel. It stays for backward compatibility, so do not remove it.
- `src/media.ts` (`./media`) and `src/transcript.ts` plus `src/transcript/` (`./transcript`): the
  two entries that live outside `src/entries/`.
- `src/styles/globals.css`: every theme token, copied to `dist/styles.css` on build.
- `tests/`: Vitest suites (only `tests/**/*.test.{ts,tsx}` run). `e2e/`: Playwright specs that run
  against the demo. `demo/`: the Next.js demo site (a separate package that installs this one
  with `file:..`).

## Commands

CI uses Node 22. Run `npm ci` first.

- `npm run build`: tsup build, then `postbuild` runs `scripts/generate-safelist.mjs` (see Styling).
- `npm run dev:lib`: tsup in watch mode.
- `npm run typecheck`: `tsc --noEmit -p tsconfig.build.json`, which checks `src/` only.
- `npm test`: Vitest, single run (`npm run test:watch`, `npm run test:coverage`).
  `tests/safelist.test.ts` skips itself until `dist/` exists, so run `npm run build` first when
  you touch styles or the safelist.
- `npm run test:e2e`: Playwright on desktop and mobile Chromium. Locally it builds the library
  and the demo, serves the demo on `http://localhost:5555/ui` and reuses a server already on that
  port. Run `npx playwright install chromium` once before the first run.
- `npm run dev`: the demo in dev mode on `http://localhost:5555/ui`. It reads the built library,
  so run `npm run build` (or keep `npm run dev:lib` running) and `cd demo && npm install` first.
- `npm run demo:build`: static export of the demo into `demo/out/`.

`.github/workflows/ci.yml` runs the type check, Vitest and the Playwright suite on every PR to
`main`. Run the type check and Vitest before you say a change is done. For a visual change, check
the demo in light and dark mode and at mobile width.

## Sub-path exports

Every component has its own sub-path so consumers load only what they import
(`import { Button } from "@speakai/ui/button"`). The barrel (`from "@speakai/ui"`) still works but
pulls in everything. To add a component, do every step below; a missed step ships a sub-path that
fails to resolve or has no types in consuming apps.

1. Create `src/components/MyComponent.tsx`.
2. Create `src/entries/my-component.ts` that re-exports the component and its props type. The
   entry name is the kebab-case file name (`StatCard.tsx` becomes `stat-card.ts`).
3. Export the component and its types from `src/index.ts`.
4. Add `"src/entries/my-component.ts"` to the `entry` array in `tsup.config.ts`, in alphabetical
   order within its group.
5. Add `"./my-component"` to the `exports` map in `package.json`, with `types`
   (`./dist/entries/my-component.d.ts`), `import` (`.mjs`) and `require` (`.js`).
6. Add `"my-component": ["dist/entries/my-component.d.ts"]` to `typesVersions` in `package.json`,
   for consumers on older TypeScript module resolution.
7. Add the sub-path to the "All available sub-paths" table and the Quick Reference imports in
   `README.md`, and a props section to the Component Reference.
8. Add tests under `tests/components/`, and a section to `demo/app/page.tsx` if it has visible UI.
9. Run `npm run build && npm run typecheck && npm test`.

Entries that break the pattern:

- `./media` (`src/media.ts`): `MediaPlayer`, `useMediaSync` and `TranscriptView`. These are not in
  the barrel.
- `./transcript` (`src/transcript.ts`): the ProseMirror transcript schema, plugins and helpers.
  Only this entry needs the `prosemirror-*` peer dependencies.
- `./cn` (`src/entries/cn.ts`): the `cn()` class-merge helper.
- `./dashboard-widgets`: one grouped entry for every dashboard widget, its prop types, metric
  registries and format helpers.
- The chart entries (`./analytics-*-chart`, `./sentiment-*-chart`) and `./dashboard-widgets` need
  the optional `recharts` peer; `./analytics-word-cloud` needs `@isoterik/react-word-cloud`.

A new runtime dependency that consumers should provide goes in `peerDependencies` (and
`peerDependenciesMeta` if optional) and in the `external` list in `tsup.config.ts`, so it is not
bundled into `dist/`.

## Styling and theming

- Colors come from CSS variables in `src/styles/globals.css`: `--color-*` values in `:root` and
  `.dark`, registered with Tailwind through `@theme inline`. Use the token classes
  (`bg-background`, `text-foreground`, `bg-primary`, `border-border`, `text-muted-foreground`)
  rather than fixed palette colors, because consumers override the tokens for their brand and dark
  mode swaps them at runtime.
- Dark mode is class-based: `@custom-variant dark` matches `.dark` on an ancestor, usually
  `<html>`.
- Every component accepts `className` and merges classes with `cn()` from `src/utils/cn.ts`.
- The build prepends `"use client"` to every emitted `.js` and `.mjs` file, so Next.js App Router
  pages can import the components without their own directive. Source files do not need one.
- The safelist: `npm run build` scans `dist/*.mjs` for Tailwind classes and writes them into the
  `@source inline(...)` block at the top of `src/styles/globals.css` and `dist/styles.css`, so
  consumers get every class without scanning `node_modules`. The block is generated, so do not
  edit it by hand; commit the regenerated `globals.css` with the change that caused it. Write
  class names as complete string literals (`"bg-primary"`, not `` `bg-${tone}` ``), because the
  scan only finds whole class names.

## Code

- Comments: one line that explains why, not what. Use a longer comment only when the logic is genuinely complex. The comment-guard hook flags multi-line comments.
- Removing or renaming an export, a sub-path or a prop breaks consuming apps. Call it out in the
  PR description and prefer adding a new prop over changing the meaning of an old one.

## Releases

Every merge to `main` runs `.github/workflows/publish.yml`. After the type check, Vitest and the
Playwright suite pass, it reads the commit subjects since the last `v*` tag, including every commit
on a merged branch. A GitHub Models call picks the bump: `fix:` means patch, `feat:` means minor,
`BREAKING CHANGE` or a removed export means major, and `chore:`, `docs:`, `ci:`, `refactor:` or
`test:` alone mean no release. When that call fails, a fallback uses the prefixes instead:
`BREAKING CHANGE` or `!:` makes a major release, `feat:` or `feat(` a minor one, and anything else
a patch, so in that case even a docs-only merge publishes a patch. The job then bumps
`package.json`, prepends to `CHANGELOG.md`, commits `chore: release vX.Y.Z [skip ci]`, tags, and
publishes to npm and GitHub Packages.

- Use conventional commit subjects, and use `feat:` only for a real new component, prop or export.
- Leave the version in `package.json` and `CHANGELOG.md` alone; the release job owns them.
- `.github/workflows/deploy-demo.yml` also rebuilds the demo and deploys it to GitHub Pages
  (`https://speakai.github.io/ui`) on every push to `main`.

## Pull requests

- Open every PR as a draft (`gh pr create --draft`, or `draft: true` with the GitHub MCP tool),
  because a human previews each PR before anything merges and a merge here publishes to npm.
  `.github/workflows/draft-pr-guard.yml` turns a PR opened as ready back into a draft. The
  developer marks it Ready; you may do so when the developer asks, after confirming with them. A
  human merges.
- Ask before any action that is shared or hard to undo: pushing to `main`, deleting branches or
  tags, publishing, or changing workflows.
- Do not commit credentials, `.env` files or an `.npmrc` with a token. Stage files by explicit
  path.

## Agent guardrails

Three hooks guard every agent session. `pr-gate.sh` blocks non-draft PR creation and merges;
`block-secrets.sh` blocks writes that contain a credential; `comment-guard.sh` runs after an edit
and flags new multi-line code comments without undoing the edit. Claude Code runs them from
`.claude/settings.json`, and there `pr-gate.sh` asks before a PR is marked Ready. Codex runs them
from `.codex/hooks.json`, with `.codex/rules/` as a backstop. A Codex hook cannot pause to ask, so
under Codex marking a PR Ready is always blocked: ask the developer to do it. The hooks live in
`.claude/hooks/ai-skills/eng-safety/` and are vendored from Speak's shared ai-skills repo, so
change them there rather than here. The plugin list is in `.claude/ai-skills.config`; this repo
has no synced skills, only the hooks and rules.

## Claude Code and Codex

Codex reads this file and skills in `.agents/skills/`. Claude Code reads `CLAUDE.md`, which only
imports this file, and skills in `.claude/skills/`. This repo has no repo-local skills today; if
one is added under `.claude/skills/`, the ai-skills installer links it into `.agents/skills/`.
After pulling, Codex users trust the project once and approve its hooks in `/hooks` (Codex 0.142 or
newer); Codex asks again whenever a hook changes.
