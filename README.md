# @speakai/ui

[![npm version](https://img.shields.io/npm/v/@speakai/ui.svg)](https://www.npmjs.com/package/@speakai/ui)
[![npm downloads](https://img.shields.io/npm/dm/@speakai/ui.svg)](https://www.npmjs.com/package/@speakai/ui)
[![license](https://img.shields.io/npm/l/@speakai/ui.svg)](https://github.com/speakai/ui/blob/main/LICENSE)

Speak AI's design system — 45 React + Tailwind components with dark/light mode, WCAG AA accessibility, and full CSS variable customization.

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
import { Button, Card, Badge, ToastProvider, useToast, AuthCard, Popover } from "@speakai/ui";

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

## Components (45)

### Auth
| Component | Description |
|-----------|-------------|
| **AuthCard** | Centered card with logo, title, and subtitle for login/register pages |
| **SSOButton** | SSO provider button with built-in Google, Apple, Microsoft icons |
| **SSOButtons** | Renders all SSO provider buttons with a shared `onProviderClick` handler |
| **PasswordInput** | Input with show/hide toggle for password fields |
| **OTPInput** | Multi-digit OTP code input with auto-focus advance, paste support |
| **AuthDivider** | Horizontal rule with centered text (default "or") for separating auth methods |

### Forms & Actions
| Component | Variants |
|-----------|----------|
| **Button** | `primary` `secondary` `danger` `ghost` `outline` `gradient` `glass` `solid` |
| **Input** | Default, error as boolean or message string |
| **SearchInput** | With search icon, `containerClassName` |
| **Select** | Children-based or `options` array prop |
| **Textarea** | Auto-height, error as boolean or message string |
| **Switch** | Toggle with label |
| **Checkbox** | With label, description, sizes, error state |
| **RadioGroup** | Vertical or horizontal radio options with keyboard navigation |
| **ColorPicker** | Native color picker with optional hex input and preset swatches |
| **ImageUploader** | Drag-and-drop image upload with preview, remove, and size validation |
| **FileDropzone** | Multi-file drag-and-drop zone with type and size validation |
| **Chips** | Tag input with autocomplete suggestions, add/remove chips |
| **Slider** | Range input with optional label and live value display |

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
| **Accordion** | Expandable content sections, `single` or `multiple` mode |
| **Stepper** | Step progress indicator, horizontal or vertical orientation |

### Data Display
| Component | Description |
|-----------|-------------|
| **Table** | Full system: Header, Body, Row, Head, Cell, `scrollable` prop |
| **TableSortHead** | Sortable column headers |
| **TablePagination** | Page controls with size selector |
| **TableActions** | Inline row action buttons |
| **TableEmpty** | Empty state row |
| **StatCard** | Dashboard stat with icon + gradient variant |
| **Badge** | `success` `warning` `error` `info` + 8 color options |
| **InfoCard** | Colored callout (6 themes) |
| **Breadcrumb** | Navigation breadcrumbs with custom separator, auto-truncation |

### Feedback
| Component | Description |
|-----------|-------------|
| **Toast** | `useToast()` hook — pause-on-hover, entry/exit animations |
| **Dialog** | Modal with focus trap, 5 sizes |
| **ConfirmDialog** | `danger` `warning` `info` — with confirm/cancel, loading state, legacy prop aliases |
| **EmptyState** | Icon + title + description + action |
| **ErrorState** | `page` `card` `inline` — with retry |
| **Skeleton** | 9 variants (page, card, form, grid, table) |

### Selectors
| Component | Description |
|-----------|-------------|
| **LanguageSelector** | Searchable language dropdown with flag display |
| **PhoneInput** | Phone number input with country code selector |
| **DatePicker** | Date selection with min/max constraints, label, and error state |
| **TimePicker** | Time selection with step control, min/max, and error state |

### Utilities
| Component | Description |
|-----------|-------------|
| **Tooltip** | 4 positions, auto-flip on viewport edge |
| **Popover** | Positioned content panel with trigger, side/align options, controlled mode |
| **DropdownMenu** | Full keyboard nav, ARIA roles, click-outside, optional trigger |
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
  --gradient-accent: 24 95% 53%;

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
  --background: 0 0% 100%;
  --foreground: 222 84% 5%;
  --card: 0 0% 100%;
  --card-foreground: 222 84% 5%;
  --popover: 0 0% 100%;
  --popover-foreground: 222 84% 5%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --accent: 210 40% 96%;
  --accent-foreground: 222 47% 11%;
  --border: 214 32% 91%;
  --input: 214 32% 91%;
  --ring: 271 91% 65%;

  /* Skeleton */
  --skeleton-bg: 220 14% 91%;
  --skeleton-highlight: 220 14% 96%;

  /* Typography */
  --font-sans: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;

  /* Shape */
  --radius: 0.75rem;
}
```

## New Component Usage

### Auth Components

```tsx
import { AuthCard, SSOButtons, AuthDivider, PasswordInput, OTPInput } from "@speakai/ui";

function LoginPage() {
  return (
    <AuthCard logo={<Logo />} title="Welcome back" subtitle="Sign in to your account">
      <SSOButtons action="login" onProviderClick={(provider) => handleSSO(provider)} />
      <AuthDivider />
      <Input placeholder="Email" />
      <PasswordInput placeholder="Password" />
      <Button variant="primary">Sign In</Button>
    </AuthCard>
  );
}
```

```tsx
// OTP verification
<OTPInput length={6} value={otp} onChange={setOtp} autoFocus />
<OTPInput length={4} value={otp} onChange={setOtp} error="Invalid code" />
```

### Form Components

```tsx
import { ColorPicker, ImageUploader, FileDropzone, Chips, Slider, RadioGroup } from "@speakai/ui";

// Color picker with preset swatches
<ColorPicker
  value={color}
  onChange={setColor}
  presetColors={["#a855f7", "#3b82f6", "#ef4444"]}
  label="Brand Color"
/>

// Image upload with preview
<ImageUploader
  value={imageUrl}
  onChange={(file) => uploadImage(file)}
  onRemove={() => setImageUrl(undefined)}
  maxSize={5 * 1024 * 1024}
/>

// Multi-file drag-and-drop
<FileDropzone
  onFiles={(files) => handleUpload(files)}
  accept="image/*,.pdf"
  maxSize={10 * 1024 * 1024}
/>

// Tag input with suggestions
<Chips
  value={tags}
  onChange={setTags}
  placeholder="Add tag..."
  suggestions={["react", "typescript", "tailwind"]}
  maxItems={10}
/>

// Range slider
<Slider value={volume} onChange={setVolume} min={0} max={100} label="Volume" showValue />

// Radio group
<RadioGroup
  value={plan}
  onChange={setPlan}
  orientation="vertical"
  options={[
    { value: "free", label: "Free" },
    { value: "pro", label: "Pro" },
    { value: "enterprise", label: "Enterprise" },
  ]}
/>
```

### Layout Components

```tsx
import { Accordion, AccordionItem, Stepper, Breadcrumb, Popover } from "@speakai/ui";

// Accordion (single or multiple mode)
<Accordion type="single">
  <AccordionItem title="Getting Started" value="start">
    <p>Welcome to the platform...</p>
  </AccordionItem>
  <AccordionItem title="Configuration" value="config">
    <p>Configure your settings...</p>
  </AccordionItem>
</Accordion>

// Stepper
<Stepper
  currentStep={1}
  orientation="horizontal"
  steps={[
    { label: "Account", description: "Create your account" },
    { label: "Profile", description: "Set up your profile" },
    { label: "Done", description: "All set" },
  ]}
/>

// Breadcrumb with truncation
<Breadcrumb
  maxItems={4}
  items={[
    { label: "Home", href: "/" },
    { label: "Settings", href: "/settings" },
    { label: "Team", href: "/settings/team" },
    { label: "Members" },
  ]}
/>

// Popover
<Popover trigger={<Button variant="outline">Options</Button>} side="bottom" align="start">
  <div className="p-4">Popover content here</div>
</Popover>
```

### Selector Components

```tsx
import { LanguageSelector, PhoneInput, DatePicker, TimePicker } from "@speakai/ui";

// Language selector with search
<LanguageSelector
  value={lang}
  onChange={setLang}
  searchable
  languages={[
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
  ]}
/>

// Phone input with country code
<PhoneInput
  value={phone}
  onChange={setPhone}
  defaultCountry="US"
  label="Phone Number"
/>

// Date and time pickers
<DatePicker
  value={date}
  onChange={setDate}
  label="Start Date"
  min={new Date()}
/>

<TimePicker
  value={time}
  onChange={setTime}
  label="Start Time"
  step={900}
  min="09:00"
  max="17:00"
/>
```

## Migration from voice-agent-client

If migrating from the inline `@/components/ui` in voice-agent-client, these backward-compatible APIs make the swap smoother:

### DropdownMenu (triggerless mode)

```tsx
// Old: DropdownMenu was just a positioned panel
<div className="relative">
  <MoreButton onClick={() => setOpen(!open)} />
  <DropdownMenu open={open}>
    <DropdownMenuItem>Edit</DropdownMenuItem>
  </DropdownMenu>
</div>

// New (recommended): pass trigger prop for built-in state + keyboard nav
<DropdownMenu trigger={<MoreButton />}>
  <DropdownMenuItem>Edit</DropdownMenuItem>
</DropdownMenu>
```

### Select (options array)

```tsx
// Both styles work:
<Select options={[{ value: "a", label: "A" }]} placeholder="Pick one" />
<Select><option value="a">A</option></Select>
```

### Input/Select/Textarea error

```tsx
<Input error={true} />           // red border only
<Input error="Name is required" /> // red border + message
```

### ConfirmDialog (legacy props)

```tsx
// Legacy voice-agent-client props still work:
<ConfirmDialog
  isOpen={open}          // alias for `open`
  message="Are you sure?" // alias for `description`
  confirmText="Delete"   // alias for `confirmLabel`
  cancelText="Cancel"    // alias for `cancelLabel`
  onCancel={close}       // alias for `onClose`
  onConfirm={handleDelete}
  variant="danger"
/>
```

### Skeleton components

```tsx
<PageSkeleton showCards={false} tableRows={8} />
<GridSkeleton count={6} columns={3} />   // count = total cards
<FormSkeleton sections={3} />            // card-wrapped sections
```

## Development

```bash
npm install       # install dependencies
npm run build     # build library
npm run dev       # start demo at localhost:5555
```

## License

MIT
