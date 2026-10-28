# Changelog

## v0.37.0 (2026-10-28)

- Merge pull request #89 from speakai/fix/phone-headers-stats;feat: compact stat cards and one-line page header descriptions on narrow screens

## v0.36.1 (2026-10-27)

- Merge pull request #88 from speakai/ci/single-verify-check;ci: one verify check per pull request; Release only builds and publishes

## v0.36.0 (2026-10-27)

- Merge pull request #87 from speakai/fix/release-runner-ubuntu-2404;ci: run pull-request CI on ubuntu-24.04 too ci: run the Release jobs on ubuntu-24.04, which Playwright supports;Merge pull request #86 from speakai/fix/demo-gradient fix(demo): use the primary Button variant where the removed gradient variant was used;Merge pull request #85 from speakai/fix/shared-tokens-test fix: build on @speakai/shared 2.1.64 and check shared colours with a test instead of a prebuild rewrite;Merge pull request #84 from speakai/feat/design-system fix: keep the Button and Card glass variants for Mac desktop chrome;feat: read identical colours from @speakai/shared design tokens

## v0.35.0 (2026-10-22)

- Merge pull request #83 from speakai/chore/combined-release-2026-10-22;chore(deps): jsdom 30, vitest 5, tsup 9; prosemirror as dev dependencies Merge remote-tracking branch 'origin/feat/dropdown-menu-sub' into chore/combined-release-2026-10-22;Merge remote-tracking branch 'origin/chore/test-cleanup' into chore/combined-release-2026-10-22 feat(dropdown-menu): add DropdownMenuSub flyout sub-menus;chore: keep agent tooling out of this public repo chore: re-sync ai-skills (pr-gate always asks before Ready);chore: re-sync ai-skills (pr-gate path hardening) chore: re-sync ai-skills (pr-gate hardening, test budget base fix);chore: agent guardrails and team rules, hooks only Merge remote-tracking branch 'origin/chore/agents-md-draft-prs' into chore/test-cleanup;test: fold repeated chart and accessibility cases into tables test: drop render-only, class-name and pass-through component tests;docs: mention test-guard, the team rules and add-rule in the README chore: render the team rules block and vendor add-rule and test-guard from ai-skills;chore: add the agent guardrail hooks and the draft PR guard docs: move agent instructions to AGENTS.md and bring the README up to date

## v0.34.0 (2026-10-14)

- Merge pull request #76 from speakai/feat/session-cards-rows-hero;chore(deps): bump @speakai/shared to 2.1.54 fix(avatar): keep the original initials for Avatar;fix(dashboards): keep the nowrap name cell for tables without row avatars refactor(avatar): export AVATAR_SHAPE_PROPS from the avatar module;feat(dashboards): round or square avatar shape for profile images refactor(dashboards): one getInitials helper, shared card layout type, folded tests;fix(dashboards): one rows-mode decision, wrapping avatar names, no hover lift, safer frame slots Merge #78 (session card thumbnails) into the session cards fold;Merge #77 (brand polish) into the session cards fold Merge #75 (speaker avatars) into the session cards fold;Merge #74 (table name column wrap) into the session cards fold Revert "refactor(dashboards): drop the speculative thumbnailUrl path, keep the capped frame loader";refactor(dashboards): drop the speculative thumbnailUrl path, keep the capped frame loader fix(dashboards): use a safelisted transition utility for card hover;refactor(dashboards): move title initials to format helpers, drop class-name test selectors, logical margin, safelist ms- and transition classes refactor(dashboards): one audio-only label path, constants at top, safelist coverage for row and hero classes;test(dashboards): drop class-name assertion and fold the assistive-tech check into the photo test fix(dashboards): assert name wrap by title not class names; safelist break- utilities;test(dashboards): fold poster tests into the table widget tests test(dashboards): fold session card tests into the table widget tests, drop class-name checks;test(dashboards): fold card avatar checks into the table widget tests fix(dashboards): keep SessionCardGrid audioOnlyLabel prop;fix(dashboards): keep paging when the rows layout falls back to the grid fix(dashboards): hide row avatars from assistive tech and tidy avatar code;feat(dashboards): session card thumbnails and capped video-frame loads feat(dashboards): brand-coloured session cards with hover polish and monogram poster;feat(dashboards): rows layout and hero banner for session cards feat(dashboards): speaker avatars on group rows and session cards;fix(dashboards): wrap long names in the table widget Name column

## v0.33.0 (2026-10-14)

- Merge pull request #73 from speakai/feat/dashboard-session-cards;feat(dashboards): polish session cards toward the demo hub look fix(build): safelist classes used only by sub-path entries;fix(dashboards): key table rows by media id feat(dashboards): card loading skeleton grid and stable media keys;refactor(dashboards): read card posters from row mediaUrl, reuse widget empty state refactor(dashboards): simplify session cards PR;fix(dashboards): notes actions without text, unlabeled actions, accessible session cards feat(dashboards): session card layout for the records table

## v0.32.1 (2026-10-08)

- Merge pull request #70 from speakai/fix/avatar-dark-contrast;fix(color-picker): visible label names the picker button when there is no hex input fix(color-picker): accessible names for picker, hex input and swatches;fix(avatar): readable initials in dark mode

## v0.32.0 (2026-10-07)

- Merge pull request #69 from speakai/feat/transcript-labels-plugin;docs(readme): drop the transcript labels plugin section chore(labels): keep only comments that prevent a bug;chore(deps): bump @speakai/shared to 2.1.36 for label types chore(labels): trim comments to the team comment rule;feat(transcript): labels plugin with word-position anchors, segmented bars and stripes fix(transcript): stable unique sentence ids on split and duplicate, keep sentiment score

## v0.31.0 (2026-10-03)

- Merge pull request #66 from speakai/feat/notes-widget-markdown;feat(dashboards): render safe markdown in the notes widget

## v0.30.0 (2026-10-03)

- Merge pull request #65 from speakai/feat/notes-widget-links;feat(dashboards): render links in the notes widget

## v0.29.1 (2026-09-13)

- Merge pull request #57 from speakai/fix/bar-chart-label-headroom;fix(charts): headroom for the value label above the tallest bar

## v0.29.0 (2026-09-13)

- Merge pull request #55 from speakai/feat/table-widget-pagination-top-scroll;feat(dashboards): table widget pagination and mirrored top scrollbar

## v0.28.0 (2026-09-03)

- Updated package;Merge pull request #52 from speakai/fix/dashboard-chart-quality feat(charts): donut tooltips show share of total alongside the value;fix(dashboards): chart rendering quality — single-color rankings, capped bar size, value labels, chronological sentiment axis

## v0.27.2 (2026-08-28)

- Merge pull request #51 from speakai/fix/tooltip-shrink-to-fit;fix(tooltip): size the bubble to its content

## v0.27.1 (2026-08-26)

- Merge pull request #50 from speakai/fix/dashboard-decimal-precision;fix(dashboards): keep two decimals on fractional metric values

## v0.27.0 (2026-08-25)

- Merge pull request #49 from speakai/feat/brand-active-tab-and-word-cloud-guard;feat(tabs,charts): brand-coloured active tab and a word-cloud chunk guard

## v0.26.1 (2026-08-23)

- Merge pull request #47 from speakai/fix/word-cloud-container-height-clamp;Clamp word cloud container height to 600px like width

## v0.26.0 (2026-08-20)

- Merge pull request #46 from speakai/fix/dashboard-bar-paint-and-table-readmore;feat(dashboards): ranked horizontal leaderboard for categorical bars, universal table row hover fix(dashboards): static bar render on share surfaces + read-more popover for long table cells

## v0.25.2 (2026-08-14)

- fix(charts): stop chart bodies collapsing to zero and the word cloud growing without bound (#44)

## v0.25.1 (2026-08-13)

- updated package

## v0.25.0 (2026-08-04)

- Merge pull request #42 from speakai/feat/field-distribution-table;feat(dashboards): comparison-table render for field-distribution

## v0.24.0 (2026-08-03)

- Merge pull request #41 from speakai/feat/field-distribution-paired-bars;feat(field-distribution): render paired bars when compareInsights present

## v0.23.0 (2026-08-02)

- Merge pull request #39 from speakai/fix/release-ai-fallback;fix(ci): make release resilient to GitHub Models outage Merge pull request #38 from speakai/feat/table-percent-format;feat(dashboard-table): support percent column format

## v0.22.4 (2026-07-25)

- Fixed rendering of x-axis date labels on the sentiment/line chart

## v0.22.3 (2026-07-23)

- Fixed transcript search to match phrases that span word nodes

## v0.22.2 (2026-07-21)

- Fixed timestamp precision in saved transcripts

## v0.22.1 (2026-07-21)

- Fixed transcript save round-trip discarding segment data, Backspace deleting merged paragraphs, and reading order on Enter split

## v0.22.0 (2026-07-21)

- Added dense-label skipping and sleeker bar hover to charts component

## v0.21.1 (2026-07-21)

- Fixed Dropdown functionality

## v0.21.0 (2026-07-17)

- Added responsive bar-chart x-axis labels

## v0.20.1 (2026-07-17)

- Fixed themed card tooltip and subtle hover cursor on bar charts

## v0.20.0 (2026-07-15)

- Added opt-in categorical bar palette for metric charts, dismissOnOutsideClick for side panels, and spec v2 widget views for dashboard widgets. Fixed various issues with charts and dashboards.

## v0.19.1 (2026-07-14)

- Fixed Dialog accessibility issues and improved test queries for portaled Dialog content

## v0.19.0 (2026-07-14)

- Added opt-in elevated prop to side panel to stack above modal dialogs

## v0.18.0 (2026-06-30)

- Added discoverable resize grip on resizable SidePanel

## v0.17.1 (2026-06-26)

- Updated SidePanel component for improved functionality

## v0.16.0 (2026-06-26)

- Added optional expand/narrow width toggle for side panel

## v0.15.3 (2026-06-22)

- Fixed UI issues

## v0.15.2 (2026-06-22)

- Fixed UI

## v0.15.1 (2026-06-22)

- Fixed UI

## v0.15.0 (2026-06-21)

- Released extracted dashboard widget set

## v0.14.0 (2026-06-20)

- Added presentational widget set and ghost-upgraded charts to dashboards

## v0.13.1 (2026-06-01)

- Fixed Speaker update mapping for speakers

## v0.13.0 (2026-05-20)

- Added 5 analytics/sentiment chart sub-path exports, fixed various transcript issues and improved Toast alignment

## v0.11.14 (2026-05-20)

- Fixed transcript boundary guard and alignment issues in Toast and DropdownMenu components.

## v0.11.13 (2026-05-13)

- Fixed dropdown alignment, improved Toast component, and fixed various bugs in the UI components.

## v0.11.12 (2026-05-11)

- Fixed Toast alignment when title only, fixed dropdown, fixed search, fixed tabs and dialogs, fixed table important fix and added tests

## v0.11.11 (2026-05-11)

- Fixed search properly, fixed tabs and dialogs, fixed dropdown, fixed table important fix and added tests

## v0.11.10 (2026-05-07)

- Fixed search functionality, fixed dropdown, fixed tabs and dialogs, and fixed table important issue with added tests.

## v0.11.9 (2026-05-04)

- Fixed search functionality, tabs, dialogs, dropdown, and table important issues, added tests

## v0.11.8 (2026-05-04)

- Fixed tabs and dialogs, fixed dropdown, fixed table important fix and added tests

## v0.11.7 (2026-04-21)

- Fixed dropdown functionality, improved table handling, and added tests

## v0.11.6 (2026-04-21)

- Fixed dropdown functionality and table important issues, added tests

## v0.11.5 (2026-04-21)

- Fixed dropdown and table important issues, added tests

## v0.11.4 (2026-04-17)

- Fixed table important fix and added tests

## v0.11.3 (2026-04-16)

- Fixed table important fix and added tests

## v0.11.2 (2026-04-15)

- Fixed tests and important issues in the table component

## v0.11.0 (2026-04-07)

- Added sub-path exports and documentation

## v0.10.2 (2026-04-06)

- Fixed media player.

## v0.10.1 (2026-04-02)

- Fixed important sidebar

## v0.10.0 (2026-04-01)

- Added dropdown side, embedded sidebar, updated switch component

## v0.9.1 (2026-04-01)

- Fixed page header

## v0.9.0 (2026-04-01)

- Added TranscriptView component and demo

## v0.8.0 (2026-04-01)

- Added BottomSheet component, refactored color tokens, and updated README

## v0.7.0 (2026-03-31)

- Added transcript ProseMirror schema & plugins

## v0.6.0 (2026-03-31)

- Added MediaPlayer component and useMediaSync hook, overhauled README docs and added inputBase utility

## v0.4.0 (2026-03-30)

- Added 19 new UI components and updated documentation/demo

## v0.3.0 (2026-03-27)

- Added Checkbox, Avatar, Switch, Progress, Dialog, Sidebar components and enhanced demo with new utility styles.