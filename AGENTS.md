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

## Tests

Tests live in the root `tests/` folder, mirroring `src/` (Vitest, `tests/**/*.test.{ts,tsx}`, not
next to the source), and Playwright specs in `e2e/`; run them with `npm test` and
`npm run test:e2e`.

## Pull requests and secrets

- A merge to `main` publishes to npm, so every PR stays a draft until a human has previewed it.
  `.github/workflows/draft-pr-guard.yml` turns a PR opened as ready back into a draft. You may
  mark a PR Ready only when the developer asks, after confirming with them. Under Codex, a hook
  cannot pause to ask, so marking Ready is always blocked: ask the developer to do it.
- Shared or hard to undo here: pushing to `main`, deleting branches or tags, publishing, and
  changing workflows.
- The library reads no secrets at runtime. The release job's npm token comes from the `NPM_TOKEN`
  GitHub Actions secret. Never commit it, an `.npmrc` with a token or a `.env` file. Stage files
  by explicit path.

<!-- BEGIN ai-skills rules: generated from speakai/ai-skills policy/; change with /add-rule or $add-rule, not here -->
## Team rules
**Working style**
- When adding or upgrading a dependency, use the latest stable version and read its current docs.
- Report an error you cannot fix instead of catching and hiding it.
- When asked for a plan, review or answer, give it and edit nothing until the developer says to build.
- Read the code, config or data before stating how something works, say what you checked, and for complex changes try to prove your own conclusion wrong before calling it done.
- Before adding a function, component, hook, script or flow, search this repo and the shared packages for one that already does it and extend that.
- Before starting, list in the plan every repo and surface the request covers (MCP, docs, mobile, shared packages, UI package, Codex config).
- Try the simplest fix first and add a helper, constant, option or layer only when a second real caller exists today.
- Before starting or resuming work in a worktree or branch, fetch and merge the latest base branch (dev, main or master per this repo) so the work starts from current code.
**Code**
- Comments explain why in one line, never what; change history, plan names and old-behavior notes go in the commit or PR.
- Match and join records by ID, never by name or label.
- Put types, enums, interfaces and constants where this repo keeps them (shared package first, then the feature's own file) and never create a file for one value.
- Release shared packages in the order shared, ui, server, client, and after publishing bump and typecheck every consumer.
**Tests**
- Every bug fix gets a test that fails without the fix, placed where this repo's AGENTS.md says tests live (full rules: the testing-policy skill, where installed).
**Pull requests**
- Open every PR as a draft (gh pr create --draft); the developer marks it Ready and a human merges.
- Add follow-up work for a task to that task's open PR in this repo instead of opening a new one.
**Safety**
- Ask before shared or irreversible actions; a step marked "needs a decision" stays undecided even inside an approved plan, and reversibility is proven (backup written, objects confirmed) before relying on it.
- Never hardcode a credential or a fallback for one; read it from the secret source this repo's AGENTS.md names.
- Say plainly what you did not verify; after a UI change open it in a browser, check light and dark mode and the widths this repo lists, and attach a screenshot to the PR.
**Definition of done**
- The branch is pushed and the PR shows the final commit.
- The final message lists every PR link with its state, what was verified and how, and what is left (the gap report).
- The change covers every repo and surface on the plan's scope list, or the PR says why one is skipped.
- Tests ran and the PR shows the command and result; a bug fix has its regression test.
<!-- END ai-skills rules -->

## Claude Code and Codex

Codex reads this file and skills in `.agents/skills/`. Claude Code reads `CLAUDE.md`, which only
imports this file, and skills in `.claude/skills/`. The guardrail hooks, the `add-rule` skill
(`/add-rule` in Claude Code, `$add-rule` in Codex) and the team rules block above are vendored
from Speak's shared ai-skills repo, so change them there rather than here. Re-vendor with that
repo's `scripts/install.sh --target <this repo> --plugins eng-safety`; the plugin list and this
repo's id are in `.claude/ai-skills.config`. After pulling, Codex users trust the project once and
approve its hooks in `/hooks` (Codex 0.142 or newer); Codex asks again whenever a hook changes.
