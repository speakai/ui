# @speakai/ui

Monorepo for Speak AI's shared React component packages — design system, media player, recorder, and transcript editor.

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@speakai/ui`](./packages/ui) | 0.1.0 | Design system — 14 React + Tailwind components with dark/light mode, WCAG AA, and full CSS variable customization |
| [`@speakai/player`](./packages/player) | 0.1.0 | Media player — video.js wrapper with transcript sync *(planned)* |
| [`@speakai/recorder`](./packages/recorder) | 0.1.0 | Recorder — audio/video recording with device selection and live transcript *(planned)* |
| [`@speakai/editor`](./packages/editor) | 0.1.0 | Transcript editor — ProseMirror-based editing with speaker labels *(planned)* |

## Quick Start

```bash
npm install @speakai/ui
```

```tsx
import { Button, Card, Badge, ToastProvider, useToast } from "@speakai/ui";
import "@speakai/ui/styles.css";
```

## Customization

Every visual aspect is controlled by CSS variables. Override them in your app to customize without touching source code:

```css
:root {
  /* Brand colors */
  --primary: 210 80% 50%;           /* Change to blue */
  --gradient-from: 210 80% 50%;     /* Gradient start */
  --gradient-to: 170 80% 50%;       /* Gradient end */

  /* Status colors */
  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  --info: 217 91% 60%;
  --destructive: 0 84% 60%;

  /* Typography */
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Shape */
  --radius: 0.5rem;

  /* Surfaces (light mode) */
  --background: 0 0% 100%;
  --foreground: 222 84% 5%;
  --card: 0 0% 100%;
  --border: 214 32% 91%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
}

.dark {
  --background: 222 84% 5%;
  --foreground: 210 40% 98%;
  --card: 222 84% 5%;
  --border: 217 33% 18%;
  --muted: 217 33% 18%;
  --muted-foreground: 215 20% 65%;
}
```

## Components

### Layout & Structure
- **Card** — `default` | `outline` | `elevated` | `glass` + optional gradient accent
- **PageHeader** — Title with gradient text, description, action slot
- **SectionHeader** — Smaller heading with optional action
- **InfoCard** — Colored callout (purple, blue, green, yellow, red, gray)
- **StatCard** — Dashboard stat with icon, label, value + gradient variant

### Forms & Inputs
- **Button** — `default` | `secondary` | `destructive` | `outline` | `ghost` | `glass` + loading state
- **Input** — With error state, 16px font to prevent iOS zoom
- **SearchInput** — Input with search icon
- **Select** — Styled native select
- **Textarea** — Auto-height textarea

### Data Display
- **Table** — Full table system with clickable rows and keyboard navigation
- **Badge** — `default` | `success` | `warning` | `destructive` | `info` | `outline` | `secondary`
- **StatusBadge** — Auto-maps status strings to badge variants

### Feedback
- **Toast** — `useToast()` hook with pause-on-hover and entry/exit animations
- **EmptyState** — Icon + title + description + action
- **ErrorState** — `page` | `card` | `inline` variants with retry
- **Skeleton** — Page, card, form, grid, table skeleton variants

### Overlay
- **DropdownMenu** — Full keyboard nav (arrow keys, escape), ARIA roles, click-outside dismiss

## Accessibility

WCAG 2.1 AA compliant:

- `focus-visible` ring on all interactive elements
- `aria-busy` on loading buttons, `aria-invalid` on error inputs
- `role="menu"` / `role="menuitem"` with full keyboard navigation
- `role="alert"` on error states, `aria-live="polite"` on toasts
- `aria-hidden="true"` on decorative elements
- Minimum 40px touch targets, 16px input text

## Demo

```bash
npm install
npm run dev     # http://localhost:4444
```

The demo includes a **live theme configurator** panel — adjust primary color, gradient, font family, and border radius in real-time to preview how CSS variables propagate across all components.

## Development

```bash
npm install                  # Install all workspaces
npm run build:ui             # Build @speakai/ui
npm run build:recorder       # Build @speakai/recorder
npm run build:editor         # Build @speakai/editor
npm run build:player         # Build @speakai/player
npm run build                # Build all
```

### Publishing

Each package publishes independently to GitHub Packages. Only publish what you changed:

```bash
cd packages/ui && npm publish
```

## Architecture

```
speak-ui/
├── packages/
│   ├── ui/                   @speakai/ui (design system)
│   │   ├── src/components/   14 React components
│   │   ├── src/utils/        cn() class merge utility
│   │   ├── src/styles/       CSS variables & design tokens
│   │   └── tailwind.config.ts
│   ├── player/               @speakai/player (planned)
│   ├── recorder/             @speakai/recorder (planned)
│   └── editor/               @speakai/editor (planned)
├── demo/                     Next.js demo with live configurator
└── package.json              npm workspaces root
```

## Tech Stack

- React 19 + TypeScript
- Tailwind CSS 3.4 with HSL CSS variable tokens
- tsup (CJS + ESM + .d.ts)
- npm workspaces
