# @speakai/ui

[![npm version](https://img.shields.io/npm/v/@speakai/ui.svg)](https://www.npmjs.com/package/@speakai/ui)
[![npm downloads](https://img.shields.io/npm/dm/@speakai/ui.svg)](https://www.npmjs.com/package/@speakai/ui)
[![license](https://img.shields.io/npm/l/@speakai/ui.svg)](https://github.com/speakai/ui/blob/main/LICENSE)

Speak AI's design system — 25 React + Tailwind components with dark/light mode, WCAG AA accessibility, and full CSS variable customization.

**[Live Preview & Design Guide →](https://speakai.github.io/ui)**

## Install

```bash
npm install @speakai/ui
```

## Setup

### 1. Import styles

```css
/* your app's globals.css */
@import "@speakai/ui/styles.css";
```

### 2. Configure Tailwind

```ts
// tailwind.config.ts
export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "./node_modules/@speakai/ui/dist/**/*.{js,mjs}",
  ],
  // ...
};
```

### 3. Use components

```tsx
import { Button, Card, Badge, ToastProvider, useToast } from "@speakai/ui";

function App() {
  return (
    <ToastProvider>
      <Card>
        <Badge variant="success">Live</Badge>
        <Button variant="primary">Get Started</Button>
      </Card>
    </ToastProvider>
  );
}
```

## Customize

Override CSS variables to match your brand — zero source code changes:

```css
:root {
  --primary: 210 80% 50%;           /* any color */
  --gradient-from: 210 80% 50%;
  --gradient-to: 170 80% 50%;
  --font-sans: "Inter", sans-serif;
  --radius: 0.5rem;
}
```

Every component updates automatically. See the [Live Preview](https://speakai.github.io/ui) for a real-time theme configurator.

## Components (25)

### Forms & Actions
| Component | Variants |
|-----------|----------|
| **Button** | `primary` `secondary` `danger` `ghost` `outline` `gradient` `glass` `solid` |
| **Input** | Default, error state |
| **SearchInput** | With search icon |
| **Select** | Styled native select |
| **Textarea** | Auto-height |
| **Switch** | Toggle with label |

### Layout
| Component | Description |
|-----------|-------------|
| **Card** | `default` `outline` `elevated` `glass` + gradient accent |
| **Sidebar** | Collapsible, mobile drawer, keyboard nav, custom link renderer |
| **SidebarLayout** | Content area that adjusts to sidebar width |
| **SidePanel** | Right/left slide-over drawer |
| **PageHeader** | Title with gradient text + action slot |
| **SectionHeader** | Smaller heading with action |
| **Tabs** | `default` `underline` `pills` — with keyboard arrow navigation |

### Data
| Component | Description |
|-----------|-------------|
| **Table** | Full system: Header, Body, Row, Head, Cell |
| **TableSortHead** | Sortable column headers |
| **TablePagination** | Page controls with size selector |
| **TableActions** | Inline row action buttons |
| **TableEmpty** | Empty state row |
| **StatCard** | Dashboard stat with icon + gradient variant |
| **Badge** | `success` `warning` `error` `info` + 8 color options |
| **InfoCard** | Colored callout (6 themes) |

### Feedback
| Component | Description |
|-----------|-------------|
| **Toast** | `useToast()` hook — pause-on-hover, entry/exit animations |
| **Dialog** | Modal with focus trap, 5 sizes |
| **ConfirmDialog** | `danger` `warning` `info` — with confirm/cancel |
| **EmptyState** | Icon + title + description + action |
| **ErrorState** | `page` `card` `inline` — with retry |
| **Skeleton** | 9 variants (page, card, form, grid, table) |

### Utilities
| Component | Description |
|-----------|-------------|
| **Tooltip** | 4 positions, auto-flip on viewport edge |
| **DropdownMenu** | Full keyboard nav, ARIA roles, click-outside |
| **Avatar** | Image with initials fallback, gradient background |
| **Progress** | Bar with default/gradient, optional label |
| **ThemeToggle** | Icon button cycling light/dark/system |
| **ThemeSelector** | Segmented control for theme selection |

## Accessibility

WCAG 2.1 AA compliant:

- `focus-visible` ring on all interactive elements
- `aria-busy`, `aria-invalid`, `aria-live`, `role="alert"`, `role="menu"`
- Dialog focus trap, Tabs arrow key nav, DropdownMenu keyboard cycling
- 40px minimum touch targets, 16px input text (prevents iOS zoom)
- Decorative elements hidden via `aria-hidden`

## CSS Variables Reference

```css
:root {
  /* Brand */
  --primary: 271 91% 65%;
  --primary-foreground: 0 0% 100%;
  --gradient-from: 271 91% 65%;
  --gradient-to: 330 81% 60%;

  /* Status */
  --success: 160 84% 39%;
  --warning: 38 92% 50%;
  --info: 217 91% 60%;
  --destructive: 0 84% 60%;

  /* Surfaces */
  --background: 0 0% 100%;
  --foreground: 222 84% 5%;
  --card: 0 0% 100%;
  --card-foreground: 222 84% 5%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;

  /* Typography */
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Shape */
  --radius: 0.75rem;
}
```

## Development

```bash
npm install       # install dependencies
npm run build     # build library
npm run dev       # start demo at localhost:5555
```

## License

MIT
