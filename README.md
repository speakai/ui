# @speakai/ui

[![npm version](https://img.shields.io/npm/v/@speakai/ui.svg)](https://www.npmjs.com/package/@speakai/ui)
[![npm downloads](https://img.shields.io/npm/dm/@speakai/ui.svg)](https://www.npmjs.com/package/@speakai/ui)
[![license](https://img.shields.io/npm/l/@speakai/ui.svg)](https://github.com/speakai/ui/blob/main/LICENSE)

Speak AI's design system — 45+ React + Tailwind components with dark/light mode, WCAG AA accessibility, and full CSS variable customization.

> **LLM NOTE:** This README is the authoritative reference for every component, prop, type, and theming rule. When generating code with `@speakai/ui`, consult the prop tables below — do not guess props. All color styling **must** use CSS variable tokens (e.g. `text-foreground`, `bg-background`). Never use hardcoded Tailwind color classes (`text-gray-500`, `bg-white`, `bg-zinc-900`, etc.) — these break dark mode.

---

## Table of Contents

- [Install](#install)
- [Setup](#setup)
- [Theming Rules](#theming-rules)
  - [CSS Variables — Full Reference](#css-variables--full-reference)
  - [Tailwind Token → Class Mapping](#tailwind-token--class-mapping)
  - [Correct vs Incorrect Color Usage](#correct-vs-incorrect-color-usage)
  - [Override Your Brand](#override-your-brand)
- [Quick Reference — All Exports](#quick-reference--all-exports)
- [Component Reference](#component-reference)
  - [Auth: AuthCard, SSOButton, SSOButtons, PasswordInput, OTPInput, AuthDivider](#auth-components)
  - [Forms: Button, Input, SearchInput, Select, Textarea, Switch, Checkbox, RadioGroup, ColorPicker, ImageUploader, FileDropzone, Chips, Slider](#form-components)
  - [Layout: Card, Sidebar, SidePanel, PageHeader, SectionHeader, Tabs, Accordion, Stepper](#layout-components)
  - [Data Display: Table system, StatCard, Badge, InfoCard, Breadcrumb](#data-display-components)
  - [Feedback: Toast, Dialog, ConfirmDialog, EmptyState, ErrorState](#feedback-components)
  - [Skeleton: PageSkeleton, GridSkeleton, FormSkeleton, TableSkeleton, Skeleton](#skeleton-components)
  - [Selectors: LanguageSelector, PhoneInput, DatePicker, TimePicker](#selector-components)
  - [Utilities: Tooltip, Popover, DropdownMenu, Avatar, Progress, ThemeToggle, ThemeSelector](#utility-components)
  - [Media: MediaPlayer, useMediaSync](#media-components)
- [Z-Index Layering](#z-index-layering)
- [Accessibility](#accessibility)

---

## Install

```bash
npm install @speakai/ui
```

## Setup

### 1. Import styles

```css
/* globals.css */
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
};
```

### 3. Dark mode

The library uses class-based dark mode (`.dark` on `<html>`). Works with `next-themes`:

```tsx
// app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Theming Rules

> **CRITICAL — Read before writing any JSX with this library.**

### CSS Variables — Full Reference

All color and shape tokens are CSS variables. They flip automatically between light and dark mode.

```css
:root {
  /* Brand */
  --primary: 271 91% 65%;              /* purple */
  --primary-foreground: 0 0% 100%;

  /* Gradient */
  --gradient-from: 271 91% 65%;        /* purple */
  --gradient-to: 330 81% 60%;          /* pink */
  --gradient-accent: 24 95% 53%;       /* orange */

  /* Status */
  --danger: 0 84% 60%;
  --danger-foreground: 0 0% 100%;
  --success: 160 84% 39%;
  --success-foreground: 0 0% 100%;
  --warning: 38 92% 50%;
  --warning-foreground: 0 0% 0%;
  --info: 217 91% 60%;
  --info-foreground: 0 0% 100%;

  /* Surfaces */
  --background: 0 0% 100%;             /* page background */
  --foreground: 222 84% 5%;            /* default text */
  --card: 0 0% 100%;                   /* card surface */
  --card-foreground: 222 84% 5%;
  --popover: 0 0% 100%;                /* dropdown/tooltip bg */
  --popover-foreground: 222 84% 5%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;                /* subtle backgrounds */
  --muted-foreground: 215 16% 47%;     /* placeholder / help text */
  --accent: 210 40% 96%;               /* hover highlight */
  --accent-foreground: 222 47% 11%;
  --border: 214 32% 91%;               /* borders */
  --input: 214 32% 91%;                /* input borders */
  --ring: 271 91% 65%;                 /* focus ring */

  /* Skeleton */
  --skeleton-bg: 220 14% 91%;
  --skeleton-highlight: 220 14% 96%;

  /* Typography */
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Shape */
  --radius: 0.75rem;                   /* border-radius base */
}
```

### Tailwind Token → Class Mapping

| Token | Tailwind class |
|-------|---------------|
| `--background` | `bg-background` / `text-background` |
| `--foreground` | `text-foreground` |
| `--primary` | `bg-primary` / `text-primary` / `border-primary` |
| `--primary-foreground` | `text-primary-foreground` |
| `--card` | `bg-card` |
| `--card-foreground` | `text-card-foreground` |
| `--popover` | `bg-popover` |
| `--popover-foreground` | `text-popover-foreground` |
| `--muted` | `bg-muted` |
| `--muted-foreground` | `text-muted-foreground` |
| `--accent` | `bg-accent` |
| `--accent-foreground` | `text-accent-foreground` |
| `--border` | `border-border` |
| `--input` | `border-input` |
| `--ring` | `ring-ring` |
| `--danger` | `text-danger` / `bg-danger` / `border-danger` |
| `--success` | `text-success` / `bg-success` |
| `--warning` | `text-warning` / `bg-warning` |
| `--info` | `text-info` / `bg-info` |

### Correct vs Incorrect Color Usage

```tsx
// ❌ WRONG — hardcoded colors break dark mode
<div className="bg-white text-gray-900 border-gray-200">
<p className="text-gray-500">Help text</p>
<button className="bg-zinc-800 text-white">Submit</button>

// ✅ CORRECT — CSS variables flip automatically
<div className="bg-background text-foreground border-border">
<p className="text-muted-foreground">Help text</p>
<button className="bg-foreground text-background">Submit</button>
```

### Override Your Brand

```css
:root {
  --primary: 210 80% 50%;        /* your brand color (HSL) */
  --gradient-from: 210 80% 50%;
  --gradient-to: 170 80% 50%;
  --radius: 0.5rem;              /* sharper corners */
  --font-sans: "Geist", sans-serif;
}
```

---

## Quick Reference — All Exports

```ts
// Auth
import {
  AuthCard, SSOButton, SSOButtons, PasswordInput, OTPInput, AuthDivider
} from "@speakai/ui";

// Forms
import {
  Button, Input, SearchInput, Select, Textarea,
  Switch, Checkbox, RadioGroup,
  ColorPicker, ImageUploader, FileDropzone, Chips, Slider
} from "@speakai/ui";

// Layout
import {
  Card, Sidebar, SidebarProvider, SidebarLayout, SidebarUser,
  SidePanel, PageHeader, SectionHeader,
  Tabs, TabsList, TabsTrigger, TabsContent,
  Accordion, AccordionItem, Stepper
} from "@speakai/ui";

// Data Display
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  TableSortHead, TableActions, TableActionButton, TableEmpty,
  TablePagination, TableSkeleton,
  StatCard, StatCardGrid, Badge, StatusBadge, InfoCard, Breadcrumb
} from "@speakai/ui";

// Feedback
import {
  ToastProvider, useToast,
  Dialog, DialogHeader, DialogBody, DialogFooter, DialogCloseButton,
  ConfirmDialog,
  EmptyState, ErrorState
} from "@speakai/ui";

// Skeleton
import {
  Skeleton, SkeletonText, PageHeaderSkeleton,
  StatCardSkeleton, StatCardsSkeletonGrid,
  PageSkeleton, CardSkeleton, GridSkeleton, FormSkeleton
} from "@speakai/ui";

// Selectors
import {
  LanguageSelector, PhoneInput, DatePicker, TimePicker
} from "@speakai/ui";

// Utilities
import {
  Tooltip, Popover,
  DropdownMenu, DropdownMenuItem, DropdownMenuDivider,
  DropdownMenuHeader, MoreButton,
  Avatar, Progress, ThemeToggle, ThemeSelector
} from "@speakai/ui";

// Media
import {
  MediaPlayer,
  useMediaSync,
} from "@speakai/ui";
```

---

## Component Reference

All components support the `className` prop for Tailwind overrides unless noted. All accept `ref` via `forwardRef`.

---

### Auth Components

#### `AuthCard`

Centered card layout for login, register, and verify pages.

```tsx
<AuthCard logo={<Logo />} title="Welcome back" subtitle="Sign in to continue">
  <Input placeholder="Email" />
  <Button variant="primary">Sign In</Button>
</AuthCard>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `title` | `string` | — | Yes |
| `subtitle` | `string` | — | No |
| `logo` | `ReactNode` | — | No |
| `children` | `ReactNode` | — | No |
| `className` | `string` | — | No |

---

#### `SSOButton`

Single SSO provider button with built-in icon.

```tsx
<SSOButton provider="google" action="login" onClick={handleGoogle} />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `provider` | `"google" \| "apple" \| "microsoft"` | — | Yes |
| `action` | `"login" \| "register"` | `"login"` | No |
| `isLoading` | `boolean` | `false` | No |
| `disabled` | `boolean` | — | No |

---

#### `SSOButtons`

Renders all three SSO buttons (Google, Apple, Microsoft) with a shared click handler.

```tsx
<SSOButtons action="register" onProviderClick={(p) => handleSSO(p)} />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `action` | `"login" \| "register"` | `"login"` | No |
| `onProviderClick` | `(provider: "google" \| "apple" \| "microsoft") => void` | — | No |
| `isLoading` | `boolean` | `false` | No |
| `disabled` | `boolean` | — | No |
| `className` | `string` | — | No |

---

#### `PasswordInput`

Input with show/hide password toggle.

```tsx
<PasswordInput
  label="Password"
  placeholder="Enter password"
  error="Password is too short"
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `error` | `boolean \| string` | — | No |
| `label` | `string` | — | No |
| `disabled` | `boolean` | — | No |

Accepts all native `<input>` props.

---

#### `OTPInput`

Multi-digit code input with auto-focus advance and paste support.

```tsx
<OTPInput length={6} value={code} onChange={setCode} autoFocus />
<OTPInput length={4} value={code} onChange={setCode} error="Invalid code" />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `string` | — | Yes |
| `onChange` | `(value: string) => void` | — | Yes |
| `length` | `number` | `6` | No |
| `error` | `boolean \| string` | — | No |
| `disabled` | `boolean` | `false` | No |
| `autoFocus` | `boolean` | `false` | No |

---

#### `AuthDivider`

Horizontal rule with centered label for separating auth options.

```tsx
<AuthDivider />                  {/* renders "or" */}
<AuthDivider text="continue with" />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `text` | `string` | `"or"` | No |
| `className` | `string` | — | No |

---

### Form Components

#### `Button`

Primary action element. Extend all native `<button>` props.

```tsx
<Button variant="primary" size="md">Save Changes</Button>
<Button variant="gradient" isLoading={saving}>Submit</Button>
<Button variant="danger" size="sm">Delete</Button>
<Button variant="ghost" size="icon"><TrashIcon /></Button>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `variant` | `"primary" \| "secondary" \| "danger" \| "ghost" \| "outline" \| "gradient" \| "glass" \| "solid"` | `"primary"` | No |
| `size` | `"sm" \| "md" \| "lg" \| "icon"` | `"md"` | No |
| `isLoading` | `boolean` | `false` | No |
| `disabled` | `boolean` | — | No |
| `children` | `ReactNode` | — | No |

**Size reference:** `sm` = h-9, `md` = h-10, `lg` = h-11, `icon` = h-10 w-10

---

#### `Input`

Standard text input. Extends all native `<input>` props.

```tsx
<Input placeholder="Email address" />
<Input error={true} />                          {/* red border only */}
<Input error="Email is required" />             {/* red border + message */}
<Input label="Full name" value={name} onChange={e => setName(e.target.value)} />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `error` | `boolean \| string` | — | No |
| `label` | `string` | — | No |
| `disabled` | `boolean` | — | No |

---

#### `SearchInput`

Input pre-configured with a search icon on the left.

```tsx
<SearchInput
  placeholder="Search agents..."
  value={query}
  onChange={e => setQuery(e.target.value)}
  containerClassName="w-64"
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `containerClassName` | `string` | — | No |

Accepts all native `<input>` props.

---

#### `Select`

Dropdown selector. Supports both `options` array and children syntax.

```tsx
{/* Options array */}
<Select
  options={[{ value: "en", label: "English" }, { value: "es", label: "Spanish" }]}
  placeholder="Select language"
  value={lang}
  onChange={e => setLang(e.target.value)}
/>

{/* Children syntax */}
<Select value={role} onChange={e => setRole(e.target.value)}>
  <option value="admin">Admin</option>
  <option value="member">Member</option>
</Select>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `options` | `Array<{ value: string; label: string }>` | — | No |
| `placeholder` | `string` | — | No |
| `error` | `boolean \| string` | — | No |
| `label` | `string` | — | No |
| `disabled` | `boolean` | — | No |
| `children` | `ReactNode` | — | No |

---

#### `Textarea`

Multi-line text input. Extends all native `<textarea>` props.

```tsx
<Textarea placeholder="Describe your agent..." rows={4} />
<Textarea error="Description is required" label="Bio" />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `error` | `boolean \| string` | — | No |
| `label` | `string` | — | No |
| `rows` | `number` | — | No |
| `disabled` | `boolean` | — | No |

---

#### `Switch`

Toggle control.

```tsx
<Switch checked={enabled} onChange={setEnabled} label="Enable notifications" />
<Switch checked={active} onChange={setActive} size="sm" />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `checked` | `boolean` | — | Yes |
| `onChange` | `(checked: boolean) => void` | — | Yes |
| `size` | `"sm" \| "default"` | `"default"` | No |
| `label` | `string` | — | No |
| `disabled` | `boolean` | `false` | No |
| `id` | `string` | — | No |

---

#### `Checkbox`

Checkbox with optional label and description.

```tsx
<Checkbox
  checked={agreed}
  onChange={e => setAgreed(e.target.checked)}
  label="I agree to the terms"
  description="By checking this box you agree..."
/>
<Checkbox size="sm" error="You must agree to continue" />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `checked` | `boolean` | — | No |
| `onChange` | `(e: ChangeEvent<HTMLInputElement>) => void` | — | No |
| `label` | `string` | — | No |
| `description` | `string` | — | No |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | No |
| `error` | `boolean \| string` | — | No |
| `disabled` | `boolean` | — | No |
| `id` | `string` | — | No |

---

#### `RadioGroup`

Group of radio buttons with keyboard navigation. Supports default (flat list) and card (bordered selection) variants.

```tsx
{/* Default — flat list */}
<RadioGroup
  value={plan}
  onChange={setPlan}
  options={[
    { value: "free", label: "Free", description: "For personal use" },
    { value: "pro", label: "Pro", description: "For teams" },
    { value: "enterprise", label: "Enterprise", disabled: true },
  ]}
/>

{/* Card variant — bordered containers with selection highlighting */}
<RadioGroup
  variant="card"
  value={timing}
  onChange={setTiming}
  options={[
    { value: "start", label: "At Start", description: "Collect before conversation begins" },
    { value: "during", label: "During", description: "Collect naturally during conversation" },
    { value: "end", label: "At End", description: "Collect before ending" },
  ]}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `string` | — | Yes |
| `onChange` | `(value: string) => void` | — | Yes |
| `options` | `RadioOption[]` | — | Yes |
| `orientation` | `"horizontal" \| "vertical"` | `"vertical"` | No |
| `variant` | `"default" \| "card"` | `"default"` | No |
| `name` | `string` | — | No |
| `disabled` | `boolean` | `false` | No |

**`RadioOption` interface:**
```ts
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
```

> **Card variant:** Each option renders inside a bordered container. Selected option gets `border-primary bg-primary/5`. Unselected options get `border-border` with hover effect. Use for settings/config where each option needs visual separation.

---

#### `ColorPicker`

Native color picker with hex input and optional preset swatches.

```tsx
<ColorPicker
  value={color}
  onChange={setColor}
  label="Brand color"
  presetColors={["#a855f7", "#3b82f6", "#ef4444", "#10b981"]}
  showInput={true}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `string` | — | Yes |
| `onChange` | `(color: string) => void` | — | Yes |
| `presetColors` | `string[]` | — | No |
| `showInput` | `boolean` | `true` | No |
| `label` | `string` | — | No |
| `disabled` | `boolean` | `false` | No |

---

#### `ImageUploader`

Drag-and-drop image upload with preview and remove button.

```tsx
<ImageUploader
  value={imageUrl}
  onChange={(file) => uploadAndSetUrl(file)}
  onRemove={() => setImageUrl(undefined)}
  maxSize={5 * 1024 * 1024}   // 5 MB
  variant="dropzone"
/>
<ImageUploader variant="avatar" value={avatarUrl} onChange={handleUpload} />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `onChange` | `(file: File) => void` | — | Yes |
| `value` | `string` | — | No |
| `onRemove` | `() => void` | — | No |
| `accept` | `string` | `"image/*"` | No |
| `maxSize` | `number` (bytes) | `10485760` (10 MB) | No |
| `placeholder` | `string` | `"Drop an image here or click to browse"` | No |
| `disabled` | `boolean` | `false` | No |
| `variant` | `"dropzone" \| "avatar"` | `"dropzone"` | No |

---

#### `FileDropzone`

Multi-file drag-and-drop upload zone.

```tsx
<FileDropzone
  onFiles={(files) => handleUpload(files)}
  accept=".pdf,.doc,.docx"
  multiple={true}
  maxSize={20 * 1024 * 1024}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `onFiles` | `(files: File[]) => void` | — | Yes |
| `accept` | `string` | — | No |
| `multiple` | `boolean` | `true` | No |
| `maxSize` | `number` (bytes) | — | No |
| `disabled` | `boolean` | `false` | No |
| `children` | `ReactNode` | — | No |

---

#### `Chips`

Tag/chip input with autocomplete dropdown.

```tsx
<Chips
  value={tags}
  onChange={setTags}
  placeholder="Add tags..."
  suggestions={["react", "typescript", "tailwind", "nextjs"]}
  maxItems={10}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `string[]` | — | Yes |
| `onChange` | `(value: string[]) => void` | — | Yes |
| `placeholder` | `string` | `"Type and press Enter"` | No |
| `suggestions` | `string[]` | — | No |
| `maxItems` | `number` | — | No |
| `disabled` | `boolean` | `false` | No |

**Keyboard:** Enter/comma to add, Backspace to remove last, Escape to close suggestions.

---

#### `Slider`

Range input with optional label and live value display. Supports inline mode for compact layouts and track overlays for media timelines.

```tsx
{/* Full-width with label */}
<Slider value={volume} onChange={setVolume} min={0} max={100} label="Volume" />

{/* Without value display */}
<Slider value={temperature} onChange={setTemperature} step={0.1} min={0} max={2} showValue={false} />

{/* Inline — compact, no header, for use in flex rows */}
<div className="flex items-center gap-2">
  <span>Weight: {weight}</span>
  <Slider inline value={weight} onChange={setWeight} min={1} max={10} showValue={false} className="w-20" />
</div>

{/* With track overlay content (markers, annotations) */}
<Slider
  value={position}
  onChange={setPosition}
  min={0}
  max={duration}
  trackChildren={
    <>
      {markers.map(m => (
        <div key={m.time} className="absolute top-0 h-full w-0.5 bg-primary" style={{ left: `${(m.time / duration) * 100}%` }} />
      ))}
    </>
  }
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `number` | — | Yes |
| `onChange` | `(value: number) => void` | — | Yes |
| `min` | `number` | `0` | No |
| `max` | `number` | `100` | No |
| `step` | `number` | `1` | No |
| `label` | `string` | — | No |
| `showValue` | `boolean` | `true` | No |
| `disabled` | `boolean` | `false` | No |
| `inline` | `boolean` | `false` | No |
| `trackChildren` | `ReactNode` | — | No |

> **Inline mode:** Renders as `inline-flex` without the label/value header row. The track fills the container width. Set a fixed width via `className="w-20"` for compact layouts.
>
> **Track children:** Content rendered inside the track `<div>` (positioned relative). Use absolute positioning for markers, annotations, or segment indicators.

---

### Layout Components

#### `Card`

Surface container with multiple visual styles.

```tsx
<Card variant="default">Content</Card>
<Card variant="elevated" showGradientAccent>Featured card</Card>
<Card variant="glass">Glassmorphism effect</Card>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `variant` | `"default" \| "outline" \| "elevated" \| "glass"` | `"default"` | No |
| `showGradientAccent` | `boolean` | `false` | No |
| `children` | `ReactNode` | — | No |

---

#### `SidebarProvider` + `Sidebar` + `SidebarLayout`

Collapsible sidebar with mobile drawer support.

```tsx
// Wrap the entire layout
<SidebarProvider>
  <div className="flex h-screen">
    <Sidebar
      sections={[
        {
          id: "main",
          items: [
            { id: "dashboard", label: "Dashboard", icon: <HomeIcon />, href: "/", active: true },
            { id: "agents", label: "Agents", icon: <BotIcon />, href: "/agents" },
          ],
        },
      ]}
      header={<Logo />}
      footer={<SidebarUser name="John Doe" email="john@example.com" />}
      renderLink={({ href, children, className }) => (
        <Link href={href} className={className}>{children}</Link>
      )}
    />
    <SidebarLayout>
      <main>{/* page content */}</main>
    </SidebarLayout>
  </div>
</SidebarProvider>
```

**`SidebarProvider` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `children` | `ReactNode` | — | Yes |
| `defaultCollapsed` | `boolean` | `false` | No |
| `storageKey` | `string` | `"sidebar-collapsed"` | No |

**`Sidebar` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `sections` | `SidebarSection[]` | — | Yes |
| `header` | `ReactNode` | — | No |
| `footer` | `ReactNode` | — | No |
| `renderLink` | `(props: { href: string; children: ReactNode; className?: string }) => ReactNode` | — | No |
| `className` | `string` | — | No |

**`SidebarSection` interface:**
```ts
interface SidebarSection {
  id: string;
  label?: string;
  items: SidebarItem[];
}
```

**`SidebarItem` interface:**
```ts
interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  children?: SidebarItem[];  // nested items
}
```

**`SidebarUser` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `name` | `string` | — | Yes |
| `email` | `string` | — | No |
| `avatar` | `ReactNode` | — | No |
| `actions` | `ReactNode` | — | No |

**`SidebarLayout` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `children` | `ReactNode` | — | Yes |
| `className` | `string` | — | No |

---

#### `SidePanel`

Slide-over drawer from left or right edge.

```tsx
<SidePanel open={open} onClose={() => setOpen(false)} title="Edit Agent" size="lg">
  <form>...</form>
</SidePanel>

<SidePanel
  open={open}
  onClose={close}
  title="Step 2"
  showBack
  onBack={goBack}
  side="right"
  footer={<div className="flex gap-2"><Button>Save</Button></div>}
>
  ...
</SidePanel>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `open` | `boolean` | — | Yes |
| `onClose` | `() => void` | — | Yes |
| `title` | `string` | — | No |
| `side` | `"left" \| "right"` | `"right"` | No |
| `size` | `"sm" \| "default" \| "lg" \| "xl" \| "full"` | `"default"` | No |
| `showBack` | `boolean` | `false` | No |
| `onBack` | `() => void` | — | No |
| `backdrop` | `boolean` | `true` | No |
| `header` | `ReactNode` | — | No |
| `footer` | `ReactNode` | — | No |
| `children` | `ReactNode` | — | No |

---

#### `PageHeader`

Page-level heading with optional gradient text accent and action slot.

```tsx
<PageHeader
  title="Voice Agents"
  gradientText="AI-Powered"
  description="Build and manage your AI voice agents."
  action={<Button variant="primary">Create Agent</Button>}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `title` | `string` | — | Yes |
| `gradientText` | `string` | — | No |
| `description` | `string` | — | No |
| `action` | `ReactNode` | — | No |

---

#### `SectionHeader`

Section-level heading, smaller than `PageHeader`.

```tsx
<SectionHeader
  title="Team Members"
  description="Manage who has access."
  action={<Button size="sm">Invite</Button>}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `title` | `string` | — | Yes |
| `description` | `string` | — | No |
| `action` | `ReactNode` | — | No |

---

#### `Tabs` + `TabsList` + `TabsTrigger` + `TabsContent`

Tabbed navigation with keyboard arrow support.

```tsx
<Tabs defaultTab="overview" onTabChange={setTab}>
  <TabsList variant="underline">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="settings" icon={<SettingsIcon />}>Settings</TabsTrigger>
    <TabsTrigger value="logs" badge={<Badge variant="info">12</Badge>}>Logs</TabsTrigger>
  </TabsList>
  <TabsContent value="overview"><OverviewPanel /></TabsContent>
  <TabsContent value="settings"><SettingsPanel /></TabsContent>
  <TabsContent value="logs"><LogsPanel /></TabsContent>
</Tabs>
```

**`Tabs` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `defaultTab` | `string` | — | Yes |
| `onTabChange` | `(tab: string) => void` | — | No |
| `children` | `ReactNode` | — | No |

**`TabsList` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `variant` | `"default" \| "underline" \| "pills"` | `"default"` | No |
| `children` | `ReactNode` | — | No |

**`TabsTrigger` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `string` | — | Yes |
| `variant` | `"default" \| "underline" \| "pills"` | `"default"` | No |
| `icon` | `ReactNode` | — | No |
| `badge` | `ReactNode` | — | No |
| `disabled` | `boolean` | `false` | No |
| `children` | `ReactNode` | — | No |

**`TabsContent` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `string` | — | Yes |
| `children` | `ReactNode` | — | No |

---

#### `Accordion` + `AccordionItem`

Expandable content sections.

```tsx
<Accordion type="single">
  <AccordionItem title="What is a voice agent?" value="q1">
    A voice agent is an AI-powered...
  </AccordionItem>
  <AccordionItem title="How does billing work?" value="q2">
    Billing is monthly...
  </AccordionItem>
</Accordion>

<Accordion type="multiple" defaultOpen={["q1"]}>
  ...
</Accordion>
```

**`Accordion` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `type` | `"single" \| "multiple"` | `"single"` | No |
| `defaultOpen` | `string[]` | `[]` | No |
| `children` | `ReactNode` | — | No |

**`AccordionItem` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `title` | `string` | — | Yes |
| `children` | `ReactNode` | — | Yes |
| `value` | `string` | — | No |
| `defaultOpen` | `boolean` | — | No |
| `disabled` | `boolean` | `false` | No |

---

#### `Stepper`

Step progress indicator.

```tsx
<Stepper
  currentStep={1}
  orientation="horizontal"
  steps={[
    { label: "Account", description: "Basic info" },
    { label: "Profile", description: "Customize" },
    { label: "Done" },
  ]}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `steps` | `StepperStep[]` | — | Yes |
| `currentStep` | `number` (0-indexed) | — | Yes |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | No |

**`StepperStep` interface:**
```ts
interface StepperStep {
  label: string;
  description?: string;
}
```

---

### Data Display Components

#### `Table` system

Full table system with sorting, pagination, actions, and empty states.

```tsx
<Table scrollable>
  <TableHeader>
    <TableRow>
      <TableSortHead sortKey="name" activeSort={sort} direction={dir} onSort={handleSort}>Name</TableSortHead>
      <TableHead>Status</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {items.map(item => (
      <TableRow key={item.id} clickable onClick={() => openItem(item)}>
        <TableCell>{item.name}</TableCell>
        <TableCell><Badge variant="success">Active</Badge></TableCell>
        <TableCell>
          <TableActions>
            <TableActionButton label="Edit" onClick={() => edit(item)}>
              <EditIcon />
            </TableActionButton>
            <TableActionButton label="Delete" variant="danger" onClick={() => del(item)}>
              <TrashIcon />
            </TableActionButton>
          </TableActions>
        </TableCell>
      </TableRow>
    ))}
    {items.length === 0 && (
      <TableEmpty colSpan={3} title="No agents yet" description="Create your first agent." />
    )}
  </TableBody>
</Table>
<TablePagination page={page} pageSize={25} total={total} onPageChange={setPage} />
```

**`Table` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `scrollable` | `boolean` | `true` | No |
| `children` | `ReactNode` | — | No |

**`TableRow` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `clickable` | `boolean` | `false` | No |
| `onClick` | `(e: MouseEvent) => void` | — | No |
| `children` | `ReactNode` | — | No |

**`TableSortHead` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `sortKey` | `string` | — | Yes |
| `activeSort` | `string \| null` | — | No |
| `direction` | `"asc" \| "desc" \| null` | — | No |
| `onSort` | `(key: string, direction: "asc" \| "desc") => void` | — | No |
| `children` | `ReactNode` | — | No |

**`TableActionButton` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `label` | `string` (aria-label) | — | Yes |
| `variant` | `"default" \| "danger"` | `"default"` | No |
| `children` | `ReactNode` | — | No |

**`TableEmpty` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `colSpan` | `number` | — | Yes |
| `title` | `string` | `"No results"` | No |
| `description` | `string` | — | No |
| `icon` | `ReactNode` | — | No |
| `action` | `ReactNode` | — | No |

**`TablePagination` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `page` | `number` | — | Yes |
| `pageSize` | `number` | — | Yes |
| `total` | `number` | — | Yes |
| `onPageChange` | `(page: number) => void` | — | Yes |
| `onPageSizeChange` | `(size: number) => void` | — | No |
| `pageSizeOptions` | `number[]` | `[10, 25, 50, 100]` | No |

**`TableSkeleton` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `columns` | `number` | `4` | No |
| `rows` | `number` | `5` | No |

---

#### `StatCard` + `StatCardGrid`

Dashboard stat tiles.

```tsx
<StatCardGrid columns={4}>
  <StatCard
    label="Total Conversations"
    value="1,234"
    icon={<ChatIcon />}
    iconColor="purple"
    variant="gradient"
  />
  <StatCard label="Active Agents" value={8} icon={<BotIcon />} iconColor="blue" />
</StatCardGrid>
```

**`StatCard` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `label` | `string` | — | Yes |
| `value` | `string \| number` | — | Yes |
| `icon` | `ReactNode` | — | No |
| `iconColor` | `"purple" \| "pink" \| "blue" \| "green" \| "orange" \| "red"` | `"purple"` | No |
| `variant` | `"default" \| "gradient"` | `"default"` | No |
| `valueClassName` | `string` | — | No |

**`StatCardGrid` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `columns` | `2 \| 3 \| 4` | `4` | No |
| `children` | `ReactNode` | — | Yes |

---

#### `Badge`

Inline status labels.

```tsx
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info" size="sm">12 new</Badge>
<Badge color="purple">Custom</Badge>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `variant` | `"default" \| "success" \| "warning" \| "error" \| "info" \| "outline" \| "secondary"` | `"default"` | No |
| `color` | `"green" \| "yellow" \| "red" \| "blue" \| "purple" \| "pink" \| "orange" \| "gray"` | — | No |
| `size` | `"sm" \| "md"` | `"md"` | No |
| `children` | `ReactNode` | — | No |

#### `StatusBadge`

Maps a `status` string to a badge variant automatically.

```tsx
<StatusBadge status="active" />     {/* green */}
<StatusBadge status="pending" />    {/* yellow */}
<StatusBadge status="failed" />     {/* red */}
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `status` | `string` | — | Yes |

---

#### `InfoCard`

Colored callout card for alerts, tips, or highlights.

```tsx
<InfoCard color="purple" title="Pro Tip" description="Use structured outputs to extract data." />
<InfoCard color="red" title="Warning">Custom children content here.</InfoCard>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `color` | `"purple" \| "blue" \| "green" \| "yellow" \| "red" \| "gray"` | `"blue"` | No |
| `title` | `string` | — | No |
| `description` | `string` | — | No |
| `children` | `ReactNode` | — | No |

---

#### `Breadcrumb`

Navigation breadcrumbs with auto-truncation.

```tsx
<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings" },
    { label: "Team" },
  ]}
  separator="›"
  maxItems={4}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `items` | `BreadcrumbItem[]` | — | Yes |
| `separator` | `ReactNode` | `"/"` | No |
| `maxItems` | `number` | `0` (no limit) | No |

**`BreadcrumbItem` interface:**
```ts
interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}
```

---

### Feedback Components

#### `ToastProvider` + `useToast`

Global toast notification system. Wrap your app in `<ToastProvider>` once, then call `useToast()` anywhere.

```tsx
// Setup (once, in root layout)
<ToastProvider>{children}</ToastProvider>

// Usage in any component
const { success, error, info, warning } = useToast();

success("Saved!", "Your changes have been saved.");
error("Failed", "Could not connect to server.");
info("Update available");
warning("Low credits", "You have fewer than 100 credits left.");
```

**`useToast` methods:**

| Method | Signature |
|--------|-----------|
| `success` | `(title: string, message?: string) => void` |
| `error` | `(title: string, message?: string) => void` |
| `info` | `(title: string, message?: string) => void` |
| `warning` | `(title: string, message?: string) => void` |

---

#### `Dialog`

Modal dialog with focus trap, backdrop, and 5 size options.

```tsx
<Dialog open={open} onClose={() => setOpen(false)} size="lg">
  <DialogHeader>
    <h2 className="text-lg font-semibold text-foreground">Edit Agent</h2>
    <DialogCloseButton onClose={() => setOpen(false)} />
  </DialogHeader>
  <DialogBody>
    <Input label="Agent name" />
  </DialogBody>
  <DialogFooter>
    <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
    <Button variant="primary" onClick={handleSave}>Save</Button>
  </DialogFooter>
</Dialog>
```

**`Dialog` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `open` | `boolean` | — | Yes |
| `onClose` | `() => void` | — | Yes |
| `size` | `"sm" \| "default" \| "lg" \| "xl" \| "full"` | `"default"` | No |
| `children` | `ReactNode` | — | No |

**`DialogCloseButton` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `onClose` | `() => void` | — | Yes |

---

#### `ConfirmDialog`

Pre-built confirmation modal for destructive or warning actions.

```tsx
<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  title="Delete agent?"
  description="This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
  isLoading={deleting}
/>
```

**Legacy prop aliases** (for backward compat): `isOpen` = `open`, `message` = `description`, `confirmText` = `confirmLabel`, `cancelText` = `cancelLabel`, `onCancel` = `onClose`.

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `open` | `boolean` | — | Yes |
| `onClose` | `() => void` | — | Yes |
| `onConfirm` | `() => void` | — | Yes |
| `title` | `string` | — | Yes |
| `description` | `string` | — | No |
| `variant` | `"danger" \| "warning" \| "info"` | `"danger"` | No |
| `confirmLabel` | `string` | `"Confirm"` | No |
| `cancelLabel` | `string` | `"Cancel"` | No |
| `isLoading` | `boolean` | `false` | No |
| `icon` | `ReactNode` | — | No |

---

#### `EmptyState`

Illustrated empty state for lists and tables.

```tsx
<EmptyState
  icon={<BotIcon />}
  title="No agents yet"
  description="Create your first AI voice agent to get started."
  action={<Button variant="primary">Create Agent</Button>}
  height="lg"
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `title` | `string` | — | Yes |
| `description` | `string` | — | No |
| `icon` | `ReactNode` | — | No |
| `action` | `ReactNode` | — | No |
| `height` | `"sm" \| "md" \| "lg"` | `"md"` | No |

---

#### `ErrorState`

Error feedback in page, card, or inline variants.

```tsx
<ErrorState
  title="Failed to load agents"
  message="Check your connection and try again."
  onRetry={refetch}
  variant="card"
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `variant` | `"page" \| "card" \| "inline"` | `"card"` | No |
| `title` | `string` | `"Something went wrong"` | No |
| `message` | `string` | `"An unexpected error occurred. Please try again."` | No |
| `onRetry` | `() => void` | — | No |
| `retryLabel` | `string` | `"Try again"` | No |

---

### Skeleton Components

Placeholder loading states. Use before data arrives.

```tsx
// Full page loading state
<PageSkeleton showCards tableRows={8} />

// Stats grid
<StatCardsSkeletonGrid count={4} />

// Card grid
<GridSkeleton columns={3} count={6} variant="agent" />

// Form sections
<FormSkeleton sections={3} />

// Table only
<TableSkeleton columns={5} rows={10} />

// Raw skeleton block (compose your own)
<Skeleton className="h-4 w-32 rounded" />
<SkeletonText lines={3} />
```

**`PageSkeleton` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `showCards` | `boolean` | `true` | No |
| `cardCount` | `number` | `4` | No |
| `tableRows` | `number` | `5` | No |

**`GridSkeleton` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `columns` | `2 \| 3 \| 4` | `3` | No |
| `count` | `number` | — | No |
| `rows` | `number` | `1` | No |
| `variant` | `"default" \| "agent"` | `"default"` | No |

**`FormSkeleton` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `fields` | `number` | `4` | No |
| `sections` | `number` | — | No |
| `variant` | `"flat" \| "sections"` | `"flat"` | No |

**`SkeletonText` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `lines` | `number` | `3` | No |

---

### Selector Components

#### `LanguageSelector`

Searchable language dropdown.

```tsx
<LanguageSelector
  value={lang}
  onChange={setLang}
  searchable
  label="Language"
  languages={[
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
  ]}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `string` | — | Yes |
| `onChange` | `(code: string) => void` | — | Yes |
| `languages` | `Array<{ code: string; name: string }>` | — | Yes |
| `placeholder` | `string` | `"Select language"` | No |
| `searchable` | `boolean` | `true` | No |
| `disabled` | `boolean` | `false` | No |
| `error` | `boolean \| string` | — | No |
| `label` | `string` | — | No |

---

#### `PhoneInput`

Phone number input with country code selector.

```tsx
<PhoneInput
  value={phone}
  onChange={setPhone}
  defaultCountry="US"
  label="Phone Number"
  error={phoneError}
/>
```

Built-in countries: US, GB, CA, AU, DE, FR, IN, JP, BR, MX (with flag emojis and dial codes).

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `string` | — | Yes |
| `onChange` | `(value: string) => void` | — | Yes |
| `defaultCountry` | `string` | `"US"` | No |
| `placeholder` | `string` | `"Phone number"` | No |
| `disabled` | `boolean` | `false` | No |
| `error` | `boolean \| string` | — | No |
| `label` | `string` | — | No |

---

#### `DatePicker`

Native date picker with `Date` object API.

```tsx
<DatePicker
  value={startDate}
  onChange={setStartDate}
  label="Start Date"
  min={new Date()}
  error={dateError}
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `onChange` | `(date: Date) => void` | — | Yes |
| `value` | `Date` | — | No |
| `min` | `Date` | — | No |
| `max` | `Date` | — | No |
| `label` | `string` | — | No |
| `error` | `boolean \| string` | — | No |
| `disabled` | `boolean` | `false` | No |
| `placeholder` | `string` | — | No |

---

#### `TimePicker`

Native time picker with `"HH:mm"` string API.

```tsx
<TimePicker
  value={startTime}
  onChange={setStartTime}
  label="Start Time"
  min="09:00"
  max="17:00"
  step={900}   // 15-minute increments
/>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `onChange` | `(time: string) => void` | — | Yes |
| `value` | `string` (`"HH:mm"`) | `""` | No |
| `min` | `string` (`"HH:mm"`) | — | No |
| `max` | `string` (`"HH:mm"`) | — | No |
| `step` | `number` (seconds) | `60` | No |
| `label` | `string` | — | No |
| `error` | `boolean \| string` | — | No |
| `disabled` | `boolean` | `false` | No |
| `placeholder` | `string` | — | No |

---

### Utility Components

#### `Tooltip`

Hover tooltip with 4 positions. Respects viewport edges.

```tsx
<Tooltip content="This will permanently delete the agent." side="top">
  <Button variant="danger">Delete</Button>
</Tooltip>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `content` | `ReactNode` | — | Yes |
| `children` | `ReactNode` | — | Yes |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"top"` | No |
| `delayMs` | `number` | `300` | No |
| `disabled` | `boolean` | `false` | No |

---

#### `Popover`

Positioned content panel. Supports controlled and uncontrolled modes.

```tsx
{/* Uncontrolled */}
<Popover
  trigger={<Button variant="outline">Options</Button>}
  side="bottom"
  align="start"
>
  <div className="p-4 text-sm text-foreground">Popover content</div>
</Popover>

{/* Controlled */}
<Popover
  trigger={<Button>Open</Button>}
  open={open}
  onOpenChange={setOpen}
>
  ...
</Popover>
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `trigger` | `ReactNode` | — | Yes |
| `children` | `ReactNode` | — | Yes |
| `side` | `"top" \| "bottom" \| "left" \| "right"` | `"bottom"` | No |
| `align` | `"start" \| "center" \| "end"` | `"center"` | No |
| `open` | `boolean` | — | No |
| `onOpenChange` | `(open: boolean) => void` | — | No |

---

#### `DropdownMenu` + `DropdownMenuItem`

Full keyboard-navigable dropdown with ARIA roles.

```tsx
{/* With built-in trigger */}
<DropdownMenu trigger={<Button variant="ghost" size="icon"><MoreHorizontalIcon /></Button>} align="right">
  <DropdownMenuItem icon={<EditIcon />} onClick={() => edit(item)}>Edit</DropdownMenuItem>
  <DropdownMenuDivider />
  <DropdownMenuItem icon={<TrashIcon />} variant="danger" onClick={() => del(item)}>Delete</DropdownMenuItem>
</DropdownMenu>

{/* Controlled / external trigger */}
<DropdownMenu open={open} onOpenChange={setOpen} align="left" width="w-56">
  <DropdownMenuHeader>Workspace</DropdownMenuHeader>
  <DropdownMenuItem>Account Settings</DropdownMenuItem>
</DropdownMenu>
```

**`DropdownMenu` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `children` | `ReactNode` | — | Yes |
| `trigger` | `ReactNode` | — | No |
| `open` | `boolean` | — | No |
| `onOpenChange` | `(open: boolean) => void` | — | No |
| `align` | `"left" \| "right"` | `"right"` | No |
| `width` | `string` (Tailwind class) | `"w-48"` | No |

**`DropdownMenuItem` props:**

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `children` | `ReactNode` | — | No |
| `variant` | `"default" \| "danger"` | `"default"` | No |
| `icon` | `ReactNode` | — | No |
| `disabled` | `boolean` | `false` | No |
| `onClick` | `(e: MouseEvent) => void` | — | No |

**`DropdownMenuHeader` props:** `children`, `className`

**`DropdownMenuDivider` props:** `className`

#### `MoreButton`

Pre-styled `···` icon button for use as a dropdown trigger.

```tsx
<DropdownMenu trigger={<MoreButton />}>...</DropdownMenu>
```

---

#### `Avatar`

User avatar with image and initials fallback.

```tsx
<Avatar name="John Doe" src={user.avatarUrl} size="default" />
<Avatar name="Bot Alpha" size="sm" variant="rounded" />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `name` | `string` | — | Yes |
| `src` | `string` | — | No |
| `size` | `"sm" \| "default" \| "lg"` | `"default"` | No |
| `variant` | `"circle" \| "rounded"` | `"circle"` | No |

---

#### `Progress`

Linear progress bar.

```tsx
<Progress value={75} variant="gradient" showLabel />
<Progress value={progress} size="sm" />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `value` | `number` (0–100) | — | Yes |
| `variant` | `"default" \| "gradient"` | `"default"` | No |
| `size` | `"sm" \| "default"` | `"default"` | No |
| `showLabel` | `boolean` | `false` | No |

---

#### `ThemeToggle`

Icon button cycling light → dark → system. Controlled or standalone.

```tsx
{/* Standalone — manages own state */}
<ThemeToggle />

{/* Controlled — pair with next-themes */}
<ThemeToggle theme={resolvedTheme as "light" | "dark" | "system"} onChange={setTheme} />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `theme` | `"light" \| "dark" \| "system"` | — | No |
| `onChange` | `(theme: "light" \| "dark" \| "system") => void` | — | No |

---

#### `ThemeSelector`

Segmented 3-option theme control (light / dark / system).

```tsx
<ThemeSelector theme={theme} onChange={setTheme} />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `theme` | `"light" \| "dark" \| "system"` | — | No |
| `onChange` | `(theme: "light" \| "dark" \| "system") => void` | — | No |

---

## Media Components

### MediaPlayer

HTML5 audio/video player with playback controls, seek bar, volume, captions, keyboard shortcuts. No Video.js dependency — uses native `<audio>` and `<video>` elements.

```tsx
import { MediaPlayer, useMediaSync } from "@speakai/ui";

function PlayerExample() {
  const { currentTime, setCurrentTime, seekTarget, seekTo, clearSeekTarget } = useMediaSync();

  return (
    <MediaPlayer
      src="https://example.com/audio.mp3"
      mediaType="audio"
      title="Interview Recording"
      seekTarget={seekTarget}
      onSeekComplete={clearSeekTarget}
      onTimeUpdate={setCurrentTime}
      captions={[
        { src: "/captions/en.vtt", label: "English", language: "en" }
      ]}
    />
  );
}
```

**Video mode:**
```tsx
<MediaPlayer
  src="https://example.com/video.mp4"
  mediaType="video"
  poster="/thumbnail.jpg"
  mode="default"
/>
```

**Docked mode** (compact bottom bar for mobile):
```tsx
<MediaPlayer src={url} mediaType="audio" title="Recording" mode="dock" />
```

| Prop | Type | Default | Required |
|------|------|---------|----------|
| `src` | `string` | — | Yes |
| `mediaType` | `"audio" \| "video"` | — | Yes |
| `title` | `string` | — | No |
| `poster` | `string` | — | No |
| `seekTarget` | `number \| null` | `null` | No |
| `onSeekComplete` | `() => void` | — | No |
| `onTimeUpdate` | `(time: number) => void` | — | No |
| `onPlayStateChange` | `(playing: boolean) => void` | — | No |
| `onDurationChange` | `(duration: number) => void` | — | No |
| `captions` | `Array<{ src, label, language }>` | `[]` | No |
| `mode` | `"default" \| "dock"` | `"default"` | No |
| `playbackRates` | `number[]` | `[0.5, 0.75, 1, 1.25, 1.5, 2]` | No |
| `className` | `string` | — | No |

**Keyboard shortcuts:** Space (play/pause), Left Arrow (seek -10s), Right Arrow (seek +30s)

### useMediaSync

Hook for syncing MediaPlayer with transcript components. Returns shared state that both player and transcript can read/write.

```tsx
const {
  currentTime,     // Current playback position (seconds)
  setCurrentTime,  // Update from player's timeupdate
  duration,        // Total media duration
  setDuration,     // Update from player's durationchange
  isPlaying,       // Whether media is currently playing
  setIsPlaying,    // Update from player's play/pause
  seekTarget,      // Time to seek to (set by transcript click)
  seekTo,          // Trigger a seek (call from transcript)
  clearSeekTarget, // Clear after seek completes
} = useMediaSync();
```

**Usage pattern — connect player and transcript:**
```tsx
function MediaView() {
  const sync = useMediaSync();

  return (
    <>
      <MediaPlayer
        src={mediaUrl}
        mediaType="audio"
        seekTarget={sync.seekTarget}
        onSeekComplete={sync.clearSeekTarget}
        onTimeUpdate={sync.setCurrentTime}
        onDurationChange={sync.setDuration}
        onPlayStateChange={sync.setIsPlaying}
      />
      <TranscriptViewer
        sentences={transcript}
        currentTime={sync.currentTime}
        onSeek={sync.seekTo}
      />
    </>
  );
}
```

---

## Z-Index Layering

Components use a consistent z-index scale. Do not override these without understanding the stack:

| Layer | z-index | Components |
|-------|---------|------------|
| Desktop sidebar | `z-30` | `Sidebar` rail |
| Backdrops | `z-40` | Sidebar mobile backdrop, `SidePanel` backdrop |
| Dropdowns / Tooltips | `z-50` | `DropdownMenu`, `Popover`, `Tooltip`, `Chips` suggestions |
| Drawers / Panels | `z-[60]` | `Sidebar` mobile drawer, `SidePanel` panel |
| Modals | `z-[70]` | `Dialog` overlay + panel |
| Toasts | `z-[9999]` | `Toast` container |

---

## Accessibility

WCAG 2.1 AA compliant:

- `focus-visible` ring on all interactive elements
- `aria-busy`, `aria-invalid`, `aria-live`, `role="alert"`, `role="menu"`, `role="listbox"`
- `Dialog` focus trap on open, restores focus on close
- `Tabs` / `DropdownMenu` arrow-key navigation
- `RadioGroup` keyboard cycling
- 40px minimum touch targets on all interactive elements
- 16px minimum input font size (prevents iOS zoom)
- Decorative SVGs use `aria-hidden="true"`

---

## Development

```bash
npm install
npm run build   # compile to dist/
npm run dev     # demo at localhost:5555
```

## License

MIT
