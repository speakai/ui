"use client";

import { useTheme } from "next-themes";
import { useState, useEffect, useCallback } from "react";
import {
  Button,
  Card,
  Badge,
  StatusBadge,
  Input,
  SearchInput,
  Select,
  Textarea,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableSkeleton,
  ToastProvider,
  useToast,
  Skeleton,
  SkeletonText,
  PageHeaderSkeleton,
  CardSkeleton,
  GridSkeleton,
  FormSkeleton,
  EmptyState,
  ErrorState,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuHeader,
  DropdownMenuDivider,
  MoreButton,
  StatCard,
  StatCardGrid,
  PageHeader,
  SectionHeader,
  InfoCard,
  cn,
} from "@speakai/ui";

/* ─── Types ─────────────────────────────────────────────────────────────────── */

interface ThemeConfig {
  primaryHue: number;
  gradientToHue: number;
  radius: number;
  font: string;
}

const FONTS = [
  { value: "system", label: "System Default", css: 'ui-sans-serif, system-ui, -apple-system, sans-serif' },
  { value: "inter", label: "Inter", css: '"Inter", sans-serif' },
  { value: "outfit", label: "Outfit", css: '"Outfit", sans-serif' },
  { value: "dm-sans", label: "DM Sans", css: '"DM Sans", sans-serif' },
  { value: "plus-jakarta", label: "Plus Jakarta Sans", css: '"Plus Jakarta Sans", sans-serif' },
  { value: "space-grotesk", label: "Space Grotesk", css: '"Space Grotesk", sans-serif' },
  { value: "geist", label: "Geist", css: '"Geist", sans-serif' },
  { value: "manrope", label: "Manrope", css: '"Manrope", sans-serif' },
  { value: "poppins", label: "Poppins", css: '"Poppins", sans-serif' },
  { value: "mono", label: "JetBrains Mono", css: '"JetBrains Mono", monospace' },
];

const PRESETS: Record<string, Partial<ThemeConfig>> = {
  "Classic B&W": { primaryHue: 0, gradientToHue: 0 },
  "Speak Purple": { primaryHue: 271, gradientToHue: 330 },
  "Ocean Blue": { primaryHue: 210, gradientToHue: 185 },
  "Emerald": { primaryHue: 162, gradientToHue: 142 },
  "Sunset": { primaryHue: 25, gradientToHue: 350 },
  "Rose": { primaryHue: 340, gradientToHue: 290 },
};

/* ─── Configurator Panel ────────────────────────────────────────────────────── */

function ConfigPanel({ config, onChange }: { config: ThemeConfig; onChange: (c: ThemeConfig) => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <div className={cn(
      "fixed right-0 top-0 z-50 h-full transition-transform duration-300",
      open ? "translate-x-0" : "translate-x-full"
    )}>
      {/* Toggle tab */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -left-10 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-l-lg border border-r-0 border-border bg-card text-muted-foreground shadow-lg hover:text-foreground transition-colors"
        aria-label={open ? "Close configurator" : "Open configurator"}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d={open
            ? "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
            : "M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
          } />
        </svg>
      </button>

      {/* Panel */}
      <div className="h-full w-72 overflow-y-auto border-l border-border bg-card p-5 shadow-2xl">
        <h2 className="text-sm font-bold text-foreground mb-1">Theme Configurator</h2>
        <p className="text-xs text-muted-foreground mb-5">Adjust CSS variables in real-time</p>

        {/* Theme mode */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Mode</label>
          <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
            {(["light", "dark", "system"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={cn(
                  "flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                  theme === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Presets</label>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(PRESETS).map(([name, preset]) => (
              <button
                key={name}
                onClick={() => onChange({ ...config, ...preset })}
                className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                <span
                  className="h-3 w-3 rounded-full flex-shrink-0"
                  style={{ background: `hsl(${preset.primaryHue}, 80%, 55%)` }}
                />
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Primary Hue */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
            <span>Primary Hue</span>
            <span className="text-foreground">{config.primaryHue}</span>
          </label>
          <input
            type="range" min="0" max="360" value={config.primaryHue}
            onChange={(e) => onChange({ ...config, primaryHue: +e.target.value })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
            style={{ background: `linear-gradient(to right, hsl(0,80%,55%), hsl(60,80%,55%), hsl(120,80%,55%), hsl(180,80%,55%), hsl(240,80%,55%), hsl(300,80%,55%), hsl(360,80%,55%))` }}
          />
        </div>

        {/* Gradient To Hue */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
            <span>Gradient End</span>
            <span className="text-foreground">{config.gradientToHue}</span>
          </label>
          <input
            type="range" min="0" max="360" value={config.gradientToHue}
            onChange={(e) => onChange({ ...config, gradientToHue: +e.target.value })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
            style={{ background: `linear-gradient(to right, hsl(0,80%,55%), hsl(60,80%,55%), hsl(120,80%,55%), hsl(180,80%,55%), hsl(240,80%,55%), hsl(300,80%,55%), hsl(360,80%,55%))` }}
          />
        </div>

        {/* Border Radius */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between">
            <span>Radius</span>
            <span className="text-foreground">{config.radius}rem</span>
          </label>
          <input
            type="range" min="0" max="1.5" step="0.125" value={config.radius}
            onChange={(e) => onChange({ ...config, radius: +e.target.value })}
            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-primary"
          />
        </div>

        {/* Font */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Font Family</label>
          <select
            value={config.font}
            onChange={(e) => onChange({ ...config, font: e.target.value })}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Generated CSS */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Generated CSS</label>
          <pre className="rounded-lg border border-border bg-muted/50 p-3 text-[10px] leading-relaxed text-muted-foreground overflow-x-auto font-mono">
{`:root {
  --primary: ${config.primaryHue} 80% 55%;
  --gradient-from: ${config.primaryHue} 80% 55%;
  --gradient-to: ${config.gradientToHue} 80% 55%;
  --radius: ${config.radius}rem;
  --font-sans: ${FONTS.find(f => f.value === config.font)?.css};
}`}
          </pre>
        </div>

        {/* Reset */}
        <button
          onClick={() => onChange({ primaryHue: 271, gradientToHue: 330, radius: 0.75, font: "system" })}
          className="w-full rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}

/* ─── Toast Demo ────────────────────────────────────────────────────────────── */

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-3">
      <Button size="sm" onClick={() => toast.success("Saved", "Your changes have been saved.")}>Success</Button>
      <Button size="sm" variant="destructive" onClick={() => toast.error("Error", "Something went wrong.")}>Error</Button>
      <Button size="sm" variant="outline" onClick={() => toast.info("Tip", "Use keyboard shortcuts for faster editing.")}>Info</Button>
      <Button size="sm" variant="secondary" onClick={() => toast.warning("Warning", "Your trial expires in 3 days.")}>Warning</Button>
    </div>
  );
}

/* ─── Layout Helpers ────────────────────────────────────────────────────────── */

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-16 scroll-mt-20">
      <h2 className="text-xl font-bold text-foreground mb-1.5 pb-3 border-b border-border">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Icon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const icons = {
  clock: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  doc: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  users: "M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z",
  screen: "M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5",
  plus: "M12 4.5v15m7.5-7.5h-15",
};

/* ─── Navigation ────────────────────────────────────────────────────────────── */

const sections = [
  "button", "card", "badge", "input", "table", "toast", "stat-card",
  "page-header", "info-card", "dropdown", "empty-state", "error-state", "skeleton",
];

function Nav() {
  return (
    <nav className="hidden xl:block fixed left-4 top-1/2 -translate-y-1/2 z-40">
      <div className="flex flex-col gap-0.5 rounded-lg border border-border bg-card/90 backdrop-blur-sm p-1.5 shadow-sm">
        {sections.map((s) => (
          <a
            key={s}
            href={`#${s}`}
            className="px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground capitalize transition-colors rounded-md hover:bg-muted"
          >
            {s.replace(/-/g, " ")}
          </a>
        ))}
      </div>
    </nav>
  );
}

/* ─── Main ──────────────────────────────────────────────────────────────────── */

export default function Home() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [config, setConfig] = useState<ThemeConfig>({
    primaryHue: 271,
    gradientToHue: 330,
    radius: 0.75,
    font: "system",
  });

  // Apply config to CSS variables
  const applyConfig = useCallback((c: ThemeConfig) => {
    const root = document.documentElement;
    // B&W: use 0 saturation for a classic monochrome look
    const isMonochrome = c.primaryHue === 0 && c.gradientToHue === 0;
    const sat = isMonochrome ? "0%" : "80%";
    root.style.setProperty("--primary", `${c.primaryHue} ${sat} ${isMonochrome ? "15%" : "55%"}`);
    root.style.setProperty("--ring", `${c.primaryHue} ${sat} ${isMonochrome ? "15%" : "55%"}`);
    root.style.setProperty("--accent", `${c.primaryHue} ${sat} 90%`);
    root.style.setProperty("--gradient-from", `${c.primaryHue} ${sat} ${isMonochrome ? "20%" : "55%"}`);
    root.style.setProperty("--gradient-to", `${c.gradientToHue} ${sat} ${isMonochrome ? "40%" : "55%"}`);
    root.style.setProperty("--radius", `${c.radius}rem`);

    const fontDef = FONTS.find(f => f.value === c.font);
    if (fontDef) root.style.setProperty("--font-sans", fontDef.css);

    setConfig(c);
  }, []);

  // Load Google Fonts dynamically
  useEffect(() => {
    const googleFonts = ["Inter", "Outfit", "DM+Sans", "Plus+Jakarta+Sans", "Space+Grotesk", "Manrope", "Poppins", "JetBrains+Mono"];
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${googleFonts.map(f => `family=${f}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <Nav />
        <ConfigPanel config={config} onChange={applyConfig} />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 mr-auto xl:mx-auto">
          {/* Header */}
          <div className="mb-12 sm:mb-16">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Design System</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent">@speakai/ui</span>
            </h1>
            <p className="mt-3 text-base text-muted-foreground max-w-2xl">
              Premium React + Tailwind components. Adjust the configurator panel to see CSS variables update in real-time.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="success">14 Components</Badge>
              <Badge variant="info">Semantic Tokens</Badge>
              <Badge>WCAG AA</Badge>
              <Badge variant="secondary">Mobile-First</Badge>
            </div>
            <div className="mt-4">
              <a
                href="/sidebar-demo"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                </svg>
                Sidebar Demo (full layout)
              </a>
            </div>
          </div>

          {/* ─── Button ──────── */}
          <Section id="button" title="Button">
            <Sub title="Variants">
              <div className="flex flex-wrap gap-3">
                <Button>Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="glass">Glass</Button>
              </div>
            </Sub>
            <Sub title="Sizes">
              <div className="flex flex-wrap gap-3 items-center">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Icon d={icons.plus} /></Button>
              </div>
            </Sub>
            <Sub title="States">
              <div className="flex flex-wrap gap-3 items-center">
                <Button isLoading>Saving...</Button>
                <Button disabled>Disabled</Button>
                <Button variant="outline" isLoading>Processing</Button>
              </div>
            </Sub>
          </Section>

          {/* ─── Card ──────── */}
          <Section id="card" title="Card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card><h3 className="font-semibold mb-1">Default</h3><p className="text-sm text-muted-foreground">Standard card</p></Card>
              <Card variant="outline"><h3 className="font-semibold mb-1">Outline</h3><p className="text-sm text-muted-foreground">Thick border</p></Card>
              <Card variant="elevated"><h3 className="font-semibold mb-1">Elevated</h3><p className="text-sm text-muted-foreground">Larger shadow</p></Card>
              <Card variant="glass"><h3 className="font-semibold mb-1">Glass</h3><p className="text-sm text-muted-foreground">Frosted effect</p></Card>
            </div>
            <div className="mt-4">
              <Card showGradientAccent><h3 className="font-semibold mb-1">Gradient Accent</h3><p className="text-sm text-muted-foreground">Top gradient stripe</p></Card>
            </div>
          </Section>

          {/* ─── Badge ──────── */}
          <Section id="badge" title="Badge">
            <Sub title="Variants">
              <div className="flex flex-wrap gap-3">
                <Badge>Default</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="secondary">Secondary</Badge>
              </div>
            </Sub>
            <Sub title="StatusBadge">
              <div className="flex flex-wrap gap-3">
                <StatusBadge status="Active" />
                <StatusBadge status="Pending" />
                <StatusBadge status="Failed" />
                <StatusBadge status="Completed" />
                <StatusBadge status="Inactive" />
              </div>
            </Sub>
          </Section>

          {/* ─── Input ──────── */}
          <Section id="input" title="Input">
            <div className="max-w-md space-y-4">
              <div><label htmlFor="d-input" className="block text-sm font-medium mb-1.5">Default</label><Input id="d-input" placeholder="Enter something..." /></div>
              <div><label htmlFor="d-err" className="block text-sm font-medium mb-1.5">Error</label><Input id="d-err" placeholder="Invalid..." error /></div>
              <div><label className="block text-sm font-medium mb-1.5">Search</label><SearchInput placeholder="Search documents..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} /></div>
              <div><label htmlFor="d-sel" className="block text-sm font-medium mb-1.5">Select</label><Select id="d-sel" placeholder="Choose type..." options={[{ value: "audio", label: "Audio" }, { value: "video", label: "Video" }, { value: "text", label: "Text" }]} /></div>
              <div><label htmlFor="d-ta" className="block text-sm font-medium mb-1.5">Textarea</label><Textarea id="d-ta" placeholder="Write something..." /></div>
            </div>
          </Section>

          {/* ─── Table ──────── */}
          <Section id="table" title="Table">
            <Sub title="With Data">
              <Table>
                <TableHeader><tr><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Duration</TableHead></tr></TableHeader>
                <TableBody>
                  <TableRow clickable><TableCell className="font-medium">Interview Recording</TableCell><TableCell>Audio</TableCell><TableCell><Badge variant="success">Completed</Badge></TableCell><TableCell className="text-muted-foreground">45:30</TableCell></TableRow>
                  <TableRow clickable><TableCell className="font-medium">Product Demo</TableCell><TableCell>Video</TableCell><TableCell><Badge variant="warning">Processing</Badge></TableCell><TableCell className="text-muted-foreground">12:15</TableCell></TableRow>
                  <TableRow clickable><TableCell className="font-medium">Meeting Notes</TableCell><TableCell>Text</TableCell><TableCell><Badge variant="destructive">Failed</Badge></TableCell><TableCell className="text-muted-foreground">--</TableCell></TableRow>
                </TableBody>
              </Table>
            </Sub>
            <Sub title="Loading"><TableSkeleton rows={3} /></Sub>
          </Section>

          {/* ─── Toast ──────── */}
          <Section id="toast" title="Toast">
            <p className="text-sm text-muted-foreground mb-4">Click to fire. Hover to pause. Errors persist 15s.</p>
            <ToastDemo />
          </Section>

          {/* ─── StatCard ──────── */}
          <Section id="stat-card" title="StatCard">
            <StatCardGrid>
              <StatCard icon={<Icon d={icons.clock} />} iconColor="purple" label="Total Hours" value="1,234" />
              <StatCard icon={<Icon d={icons.doc} />} iconColor="blue" label="Documents" value="567" />
              <StatCard icon={<Icon d={icons.users} />} iconColor="green" label="Speakers" value="89" />
              <StatCard variant="gradient" icon={<Icon d={icons.screen} />} iconColor="purple" label="Credits" value="$42.50" />
            </StatCardGrid>
          </Section>

          {/* ─── PageHeader ──────── */}
          <Section id="page-header" title="PageHeader">
            <Card>
              <PageHeader title="Your Agents" gradientText="Agents" description="Design, deploy, and monitor your AI fleet." action={<Button size="sm">New Agent</Button>} />
              <div className="border-t border-border pt-4 mt-2">
                <SectionHeader title="Recent Activity" action={<Button variant="ghost" size="sm">View All</Button>} />
              </div>
            </Card>
          </Section>

          {/* ─── InfoCard ──────── */}
          <Section id="info-card" title="InfoCard">
            <div className="space-y-3">
              <InfoCard color="purple" title="Pricing" description="Pay only for what you use."><span className="text-lg font-bold">$0.10/min</span></InfoCard>
              <InfoCard color="blue" title="Tip" description="Keyboard shortcuts make editing 3x faster." />
              <InfoCard color="yellow" title="Warning" description="Trial expires in 3 days." />
              <InfoCard color="red" title="Action Required" description="This cannot be undone." />
              <InfoCard color="green" title="All Systems Go" description="Everything running smoothly." />
            </div>
          </Section>

          {/* ─── Dropdown ──────── */}
          <Section id="dropdown" title="DropdownMenu">
            <div className="relative inline-block">
              <MoreButton onClick={() => setDropdownOpen(!dropdownOpen)} />
              <DropdownMenu open={dropdownOpen} align="left">
                <DropdownMenuHeader>Actions</DropdownMenuHeader>
                <DropdownMenuItem onClick={() => setDropdownOpen(false)}>Edit</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDropdownOpen(false)}>Duplicate</DropdownMenuItem>
                <DropdownMenuDivider />
                <DropdownMenuItem variant="danger" onClick={() => setDropdownOpen(false)}>Delete</DropdownMenuItem>
              </DropdownMenu>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">Arrow keys navigate, Escape closes.</p>
          </Section>

          {/* ─── EmptyState ──────── */}
          <Section id="empty-state" title="EmptyState">
            <EmptyState icon={<Icon d={icons.doc} />} title="No documents yet" description="Upload your first document to get started." action={<Button size="sm">Upload</Button>} height="sm" />
          </Section>

          {/* ─── ErrorState ──────── */}
          <Section id="error-state" title="ErrorState">
            <div className="space-y-6">
              <Sub title="Inline"><ErrorState variant="inline" message="Failed to load transcript." onRetry={() => {}} /></Sub>
              <Sub title="Card"><Card><ErrorState variant="card" title="Load Failed" message="Could not fetch recordings." onRetry={() => {}} /></Card></Sub>
            </div>
          </Section>

          {/* ─── Skeleton ──────── */}
          <Section id="skeleton" title="Skeleton">
            <div className="space-y-8">
              <Sub title="Basic"><div className="max-w-md space-y-3"><Skeleton className="h-8 w-48" /><SkeletonText lines={3} /></div></Sub>
              <Sub title="Page Header"><PageHeaderSkeleton /></Sub>
              <Sub title="Card Grid"><GridSkeleton count={3} columns={3} /></Sub>
              <Sub title="Form"><FormSkeleton sections={2} /></Sub>
            </div>
          </Section>

          <footer className="mt-16 pt-8 border-t border-border text-center pb-8">
            <p className="text-sm text-muted-foreground">@speakai/ui v0.1.0 — Semantic tokens, dark/light, WCAG AA, mobile-first</p>
          </footer>
        </div>
      </div>
    </ToastProvider>
  );
}
