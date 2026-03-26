"use client";

import { useTheme } from "next-themes";
import React, { useState, useEffect, useCallback } from "react";
import {
  Button, Card, Badge, StatusBadge, Input, SearchInput, Select, Textarea, Checkbox,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableActions, TableActionButton, TableSkeleton, TableSortHead, TablePagination, TableEmpty,
  ToastProvider, useToast,
  Skeleton, SkeletonText, PageHeaderSkeleton, GridSkeleton, FormSkeleton, PageSkeleton,
  EmptyState, ErrorState,
  Avatar, Switch, Progress,
  DropdownMenu, DropdownMenuItem, DropdownMenuHeader, DropdownMenuDivider, MoreButton,
  StatCard, StatCardGrid, PageHeader, SectionHeader, InfoCard,
  Dialog, DialogHeader, DialogBody, DialogFooter, DialogCloseButton, ConfirmDialog,
  ThemeSelector, ThemeToggle,
  Tooltip,
  Tabs, TabsList, TabsTrigger, TabsContent,
  SidePanel,
  Sidebar, SidebarProvider, SidebarLayout, SidebarUser, useSidebar,
  cn,
} from "@speakai/ui";
import type { SidebarSection } from "@speakai/ui";

/* ─── Theme Config ──────────────────────────────────────────────────────────── */

interface ThemeConfig { primaryHue: number; gradientToHue: number; radius: number; font: string; }

const FONTS = [
  { value: "system", label: "System", css: 'ui-sans-serif, system-ui, -apple-system, sans-serif' },
  { value: "poppins", label: "Poppins", css: 'var(--font-poppins), sans-serif' },
  { value: "inter", label: "Inter", css: 'var(--font-inter), sans-serif' },
  { value: "outfit", label: "Outfit", css: 'var(--font-outfit), sans-serif' },
  { value: "dm-sans", label: "DM Sans", css: 'var(--font-dm-sans), sans-serif' },
  { value: "space-grotesk", label: "Space Grotesk", css: 'var(--font-space-grotesk), sans-serif' },
  { value: "manrope", label: "Manrope", css: 'var(--font-manrope), sans-serif' },
  { value: "mono", label: "JetBrains Mono", css: 'var(--font-mono), monospace' },
];

const PRESETS: Record<string, Partial<ThemeConfig>> = {
  "Classic B&W": { primaryHue: 0, gradientToHue: 0 },
  "Speak Purple": { primaryHue: 271, gradientToHue: 330 },
  "Ocean Blue": { primaryHue: 210, gradientToHue: 185 },
  "Emerald": { primaryHue: 162, gradientToHue: 142 },
  "Sunset": { primaryHue: 25, gradientToHue: 350 },
  "Rose": { primaryHue: 340, gradientToHue: 290 },
};

/* ─── Icons ─────────────────────────────────────────────────────────────────── */

function I({ d }: { d: string }) {
  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}
function I4({ d }: { d: string }) {
  return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={d} /></svg>;
}

const icons = {
  home: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  sparkle: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z",
  puzzle: "M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 0 1-.657.643 48.39 48.39 0 0 1-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 0 1-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 0 0-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 0 1-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 0 0 .657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 0 1-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 0 0 5.427-.63 48.05 48.05 0 0 0 .582-4.717.532.532 0 0 0-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 0 0 .658-.663 48.422 48.422 0 0 0-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 0 1-.61-.58Z",
  layout: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z",
  table: "M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v1.5c0 .621-.504 1.125-1.125 1.125",
  chat: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z",
  bell: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0",
  cog: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z",
  doc: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  plus: "M12 4.5v15m7.5-7.5h-15",
  pencil: "m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10",
  trash: "m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0",
  copy: "M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75",
  users: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  clock: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  screen: "M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5",
  swatch: "M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402M6.75 21A3.75 3.75 0 0 1 3 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 0 0 3.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008Z",
  check: "M4.5 12.75l6 6 9-13.5",
  toggle: "M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9",
};

/* ─── Grouped Sidebar Sections ────────────────────────────────────────────── */

const sidebarGroups = [
  {
    id: "forms",
    label: "Forms & Actions",
    items: [
      { id: "button", icon: icons.puzzle, label: "Button" },
      { id: "input", icon: icons.pencil, label: "Input & Select" },
      { id: "switch", icon: icons.toggle, label: "Switch" },
      { id: "checkbox", icon: icons.check, label: "Checkbox" },
    ],
  },
  {
    id: "layout",
    label: "Layout",
    items: [
      { id: "card", icon: icons.layout, label: "Card" },
      { id: "page-header", icon: icons.doc, label: "Page Header" },
      { id: "tabs", icon: icons.layout, label: "Tabs" },
    ],
  },
  {
    id: "data",
    label: "Data Display",
    items: [
      { id: "table", icon: icons.table, label: "Table" },
      { id: "stat-card", icon: icons.screen, label: "Stat Card" },
      { id: "badge", icon: icons.sparkle, label: "Badge" },
      { id: "info-card", icon: icons.chat, label: "Info Card" },
    ],
  },
  {
    id: "feedback",
    label: "Feedback",
    items: [
      { id: "toast", icon: icons.bell, label: "Toast" },
      { id: "dialog", icon: icons.layout, label: "Dialog" },
      { id: "empty-state", icon: icons.doc, label: "Empty State" },
      { id: "error-state", icon: icons.bell, label: "Error State" },
    ],
  },
  {
    id: "utilities",
    label: "Utilities",
    items: [
      { id: "dropdown", icon: icons.cog, label: "Dropdown Menu" },
      { id: "tooltip", icon: icons.chat, label: "Tooltip" },
      { id: "avatar", icon: icons.users, label: "Avatar" },
      { id: "progress", icon: icons.screen, label: "Progress" },
    ],
  },
  {
    id: "skeleton",
    label: "Skeleton",
    items: [
      { id: "skeleton", icon: icons.layout, label: "Loading Skeletons" },
    ],
  },
];

function useSidebarSections(): SidebarSection[] {
  const [active, setActive] = useState("button");

  const handleClick = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return sidebarGroups.map((group) => ({
    id: group.id,
    label: group.label,
    items: group.items.map((n) => ({
      id: n.id,
      label: n.label,
      icon: <I4 d={n.icon} />,
      active: active === n.id,
      onClick: () => handleClick(n.id),
    })),
  }));
}

/* ─── Sidebar Header ────────────────────────────────────────────────────────── */

function SidebarHeader() {
  const { collapsed } = useSidebar();
  return (
    <a href="https://speakai.co?ref=design-system" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 min-w-0 transition-opacity hover:opacity-80">
      <img src="/ui/logo.jpg" alt="Speak" className="h-7 w-7 shrink-0 rounded-lg object-cover" />
      {!collapsed && <span className="text-sm font-semibold text-foreground truncate">@speakai/ui</span>}
    </a>
  );
}

/* ─── Sidebar Footer with theme toggle ──────────────────────────────────────── */

function SidebarFooterContent() {
  const { collapsed } = useSidebar();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center justify-between gap-2">
      {!collapsed && <span className="text-xs text-muted-foreground truncate">Design System</span>}
      {mounted && <ThemeToggle theme={theme as "light" | "dark" | "system"} onChange={(t) => setTheme(t)} />}
    </div>
  );
}

/* ─── CodeBlock with copy button ────────────────────────────────────────────── */

function CodeBlock({ code, children }: { code: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const codePanel = (
    <div className="relative rounded-lg border border-border bg-muted/30 group min-w-0">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
        aria-label="Copy code"
      >
        {copied ? (
          <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={icons.check} /></svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={icons.copy} /></svg>
        )}
      </button>
      <pre className="overflow-x-auto p-3.5 text-[11px] leading-relaxed text-muted-foreground font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );

  // Standalone code block (no preview)
  if (!children) {
    return <div className="mt-3">{codePanel}</div>;
  }

  // Preview only — code is toggled from the Section title bar
  return <>{children}</>;
}

/** Code toggle context — allows Section title to toggle code visibility */
const CodeToggleContext = React.createContext<{ open: boolean; setOpen: (o: boolean) => void } | null>(null);

function CodeProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return <CodeToggleContext.Provider value={{ open, setOpen }}>{children}</CodeToggleContext.Provider>;
}

function useCodeToggle() {
  return React.useContext(CodeToggleContext);
}

/** Renders the code panel only when toggled open from the Section title */
function CodePanel({ code }: { code: string }) {
  const ctx = useCodeToggle();
  const [copied, setCopied] = useState(false);
  if (!ctx?.open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mt-3 relative rounded-lg border border-border bg-muted/30 group min-w-0">
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 z-10 rounded-md p-1.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted hover:text-foreground"
        aria-label="Copy code"
      >
        {copied ? (
          <svg className="h-4 w-4 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={icons.check} /></svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d={icons.copy} /></svg>
        )}
      </button>
      <pre className="overflow-x-auto p-3.5 text-[11px] leading-relaxed text-muted-foreground font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Switch Demo ───────────────────────────────────────────────────────────── */

function SwitchDemo() {
  const [on1, setOn1] = useState(false);
  const [on2, setOn2] = useState(true);
  const [on3, setOn3] = useState(false);
  return (
    <div className="flex flex-col gap-4 items-start">
      <Switch checked={on1} onChange={setOn1} label="Email notifications" />
      <Switch checked={on2} onChange={setOn2} label="Dark mode" />
      <Switch checked={on3} onChange={setOn3} label="Disabled example" disabled />
      <Switch checked={true} onChange={() => { }} label="Small size" size="sm" />
    </div>
  );
}

/* ─── Toast Demo ────────────────────────────────────────────────────────────── */

function ToastDemo() {
  const toast = useToast();
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => toast.success("Saved", "Changes saved.")}>Success</Button>
      <Button size="sm" variant="danger" onClick={() => toast.error("Error", "Something went wrong.")}>Error</Button>
      <Button size="sm" variant="outline" onClick={() => toast.info("Tip", "Use keyboard shortcuts.")}>Info</Button>
      <Button size="sm" variant="secondary" onClick={() => toast.warning("Warning", "Trial expires soon.")}>Warning</Button>
    </div>
  );
}

/* ─── Layout Helpers ────────────────────────────────────────────────────────── */

function Section({ id, title, code, children }: { id: string; title: string; code?: string; children: React.ReactNode }) {
  if (!code) {
    return (
      <section id={id} className="mb-10 scroll-mt-6">
        <h3 className="text-base font-semibold text-foreground mb-4 pb-2 border-b border-border">{title}</h3>
        {children}
      </section>
    );
  }

  return (
    <CodeProvider>
      <section id={id} className="mb-10 scroll-mt-6">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <CodeToggleButton />
        </div>
        <CodePanel code={code} />
        {children}
      </section>
    </CodeProvider>
  );
}

function CodeToggleButton() {
  const ctx = useCodeToggle();
  if (!ctx) return null;
  return (
    <button
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
        ctx.open ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
      aria-label={ctx.open ? "Hide code" : "Show code"}
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75 22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3-4.5 16.5" /></svg>
      {ctx.open ? "Hide" : "Code"}
    </button>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="mb-6"><h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">{title}</h4>{children}</div>;
}

function CategoryHeader({ title }: { title: string }) {
  return (
    <div className="mt-14 mb-6 first:mt-0">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 h-px bg-gradient-to-r from-gradient-from/40 to-transparent" />
    </div>
  );
}

/* ─── Config Panel (SidePanel) ──────────────────────────────────────────────── */

function ConfigPanel({ config, onChange, open, onClose }: { config: ThemeConfig; onChange: (c: ThemeConfig) => void; open: boolean; onClose: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <SidePanel open={open} onClose={onClose} title="Theme Configurator" side="right" size="sm" backdrop={false}>
      <div className="p-4 space-y-5">
        {mounted && (
          <div>
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Mode</label>
            <ThemeSelector theme={theme as "light" | "dark" | "system"} onChange={(t) => setTheme(t)} />
          </div>
        )}
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Presets</label>
          <div className="grid grid-cols-2 gap-1.5">
            {Object.entries(PRESETS).map(([name, preset]) => (
              <button key={name} onClick={() => onChange({ ...config, ...preset })} className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: `hsl(${preset.primaryHue}, ${preset.primaryHue === 0 ? 0 : 80}%, 55%)` }} />
                {name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between"><span>Primary</span><span className="text-foreground">{config.primaryHue}</span></label>
          <input type="range" min="0" max="360" value={config.primaryHue} onChange={(e) => onChange({ ...config, primaryHue: +e.target.value })} className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary" style={{ background: "linear-gradient(to right, hsl(0,80%,55%), hsl(60,80%,55%), hsl(120,80%,55%), hsl(180,80%,55%), hsl(240,80%,55%), hsl(300,80%,55%), hsl(360,80%,55%))" }} />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between"><span>Gradient End</span><span className="text-foreground">{config.gradientToHue}</span></label>
          <input type="range" min="0" max="360" value={config.gradientToHue} onChange={(e) => onChange({ ...config, gradientToHue: +e.target.value })} className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary" style={{ background: "linear-gradient(to right, hsl(0,80%,55%), hsl(60,80%,55%), hsl(120,80%,55%), hsl(180,80%,55%), hsl(240,80%,55%), hsl(300,80%,55%), hsl(360,80%,55%))" }} />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex justify-between"><span>Radius</span><span className="text-foreground">{config.radius}rem</span></label>
          <input type="range" min="0" max="1.5" step="0.125" value={config.radius} onChange={(e) => onChange({ ...config, radius: +e.target.value })} className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-primary" />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Font</label>
          <select value={config.font} onChange={(e) => onChange({ ...config, font: e.target.value })} className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground">
            {FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">CSS Variables</label>
          <pre className="rounded-lg border border-border bg-muted/50 p-2.5 text-[10px] leading-relaxed text-muted-foreground overflow-x-auto font-mono">
            {`:root {
  --color-primary: hsl(${config.primaryHue} 80% 55%);
  --color-gradient-from: hsl(${config.primaryHue} 80% 55%);
  --color-gradient-to: hsl(${config.gradientToHue} 80% 55%);
  --radius-lg: ${config.radius}rem;
  --font-sans: ${FONTS.find(f => f.value === config.font)?.css};
}`}
          </pre>
        </div>
        <button onClick={() => onChange({ primaryHue: 271, gradientToHue: 330, radius: 0.75, font: "inter" })} className="w-full rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          Reset Defaults
        </button>
      </div>
    </SidePanel>
  );
}

/* ─── Main Content ──────────────────────────────────────────────────────────── */

function DemoContent() {
  const sidebarSections = useSidebarSections();
  const [configOpen, setConfigOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);
  const [tablePage, setTablePage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [config, setConfig] = useState<ThemeConfig>({ primaryHue: 271, gradientToHue: 330, radius: 0.75, font: "poppins" });

  const applyConfig = useCallback((c: ThemeConfig) => {
    const root = document.documentElement;
    const isMonochrome = c.primaryHue === 0 && c.gradientToHue === 0;

    if (isMonochrome) {
      root.style.setProperty("--color-primary", "hsl(0 0% 9%)");
      root.style.setProperty("--color-primary-foreground", "hsl(0 0% 100%)");
      root.style.setProperty("--color-ring", "hsl(0 0% 9%)");
      root.style.setProperty("--color-gradient-from", "hsl(0 0% 9%)");
      root.style.setProperty("--color-gradient-to", "hsl(0 0% 35%)");
      const isDark = document.documentElement.classList.contains("dark");
      if (isDark) {
        root.style.setProperty("--color-primary", "hsl(0 0% 95%)");
        root.style.setProperty("--color-primary-foreground", "hsl(0 0% 9%)");
        root.style.setProperty("--color-ring", "hsl(0 0% 95%)");
        root.style.setProperty("--color-gradient-from", "hsl(0 0% 95%)");
        root.style.setProperty("--color-gradient-to", "hsl(0 0% 60%)");
      }
    } else {
      root.style.setProperty("--color-primary", `hsl(${c.primaryHue} 80% 55%)`);
      root.style.setProperty("--color-primary-foreground", "hsl(0 0% 100%)");
      root.style.setProperty("--color-ring", `hsl(${c.primaryHue} 80% 55%)`);
      root.style.setProperty("--color-gradient-from", `hsl(${c.primaryHue} 80% 55%)`);
      root.style.setProperty("--color-gradient-to", `hsl(${c.gradientToHue} 80% 55%)`);
    }

    root.style.setProperty("--radius-lg", `${c.radius}rem`);
    root.style.setProperty("--radius-xl", `${c.radius + 0.25}rem`);
    root.style.setProperty("--radius-2xl", `${c.radius + 0.5}rem`);
    root.style.setProperty("--radius-md", `${Math.max(0, c.radius - 0.375)}rem`);
    root.style.setProperty("--radius-sm", `${Math.max(0, c.radius - 0.5)}rem`);
    const fontDef = FONTS.find(f => f.value === c.font);
    if (fontDef) root.style.setProperty("--font-sans", fontDef.css);
    setConfig(c);
  }, []);

  useEffect(() => {
    applyConfig(config);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Sidebar
        header={<SidebarHeader />}
        sections={sidebarSections}
        footer={<SidebarFooterContent />}
      />

      <Tooltip content="Theme Configurator" side="left">
        <button
          onClick={() => setConfigOpen(true)}
          className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-gradient-from to-gradient-to text-white shadow-lg transition-transform hover:scale-105 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Open theme configurator"
        >
          <I d={icons.swatch} />
        </button>
      </Tooltip>

      <SidebarLayout>
        <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              <span className="bg-gradient-to-r from-gradient-from to-gradient-to bg-clip-text text-transparent">Design System</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">26 components, semantic tokens, WCAG AA, mobile-first</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="success" size="sm">25 Components</Badge>
              <Badge variant="info" size="sm">CSS Variables</Badge>
              <Badge size="sm">Accessible</Badge>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/*  FORMS & ACTIONS                                                   */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <CategoryHeader title="Forms & Actions" />

          <Section id="button" title="Button" code={`<Button>Primary</Button>
<Button variant="danger">Danger</Button>
<Button variant="gradient">Gradient</Button>
<Button size="sm">Small</Button>
<Button size="icon"><PlusIcon /></Button>
<Button isLoading>Saving</Button>`}>
            <Sub title="Variants">
              <div className="flex flex-wrap gap-2"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="danger">Danger</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="gradient">Gradient</Button><Button variant="glass">Glass</Button><Button variant="solid">Solid</Button></div>
            </Sub>
            <Sub title="Sizes">
              <div className="flex flex-wrap gap-2 items-center"><Button size="sm">Small</Button><Button>Default</Button><Button size="lg">Large</Button><Button size="icon"><I4 d={icons.plus} /></Button></div>
            </Sub>
            <Sub title="States">
              <div className="flex flex-wrap gap-2"><Button isLoading>Saving</Button><Button disabled>Disabled</Button></div>
            </Sub>
          </Section>

          <Section id="input" title="Input & Select" code={`<Input placeholder="Enter name..." />
<Input error="Required" />       {/* string: border + message */}
<Input error={true} />           {/* boolean: border only */}
<SearchInput placeholder="Search..." containerClassName="max-w-xs" />
<Select options={[{ value: "sm", label: "Small" }]} placeholder="Pick..." />
<Select><option value="audio">Audio</option></Select>
<Textarea placeholder="Write something..." />`}>
            <div className="max-w-md space-y-4">
              <Sub title="Input"><Input placeholder="Default input..." /></Sub>
              <Sub title="Error (string)"><Input placeholder="With error..." error="This field is required" /></Sub>
              <Sub title="SearchInput"><SearchInput placeholder="Search..." value={searchValue} onChange={(e) => setSearchValue(e.target.value)} containerClassName="max-w-xs" /></Sub>
              <Sub title="Select (options)"><Select options={[{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }]} placeholder="Pick a size..." /></Sub>
              <Sub title="Select (children)"><Select defaultValue=""><option value="" disabled>Select type...</option><option value="audio">Audio</option><option value="video">Video</option></Select></Sub>
              <Sub title="Textarea"><Textarea placeholder="Write something..." /></Sub>
            </div>
          </Section>

          <Section id="switch" title="Switch" code={`<Switch checked={on} onChange={setOn} label="Notifications" />
<Switch checked={on} onChange={setOn} size="sm" disabled />`}>
            <SwitchDemo />
          </Section>

          <Section id="checkbox" title="Checkbox" code={`<Checkbox label="Accept terms" />
<Checkbox label="Newsletter" description="Get weekly updates" />
<Checkbox label="Required" error="You must accept" />
<Checkbox label="Disabled" disabled checked />`}>
            <div className="flex flex-col gap-4 items-start">
              <Checkbox label="Accept terms and conditions" />
              <Checkbox label="Subscribe to newsletter" description="Get weekly updates and tips" />
              <Checkbox label="Required field" error="You must accept the terms" />
              <Checkbox label="Disabled checked" disabled defaultChecked />
              <Checkbox label="Small" size="sm" />
              <Checkbox label="Large" size="lg" description="A larger checkbox with description" />
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/*  LAYOUT                                                            */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <CategoryHeader title="Layout" />

          <Section id="card" title="Card" code={`<Card variant="elevated">Content</Card>
<Card variant="glass">Frosted</Card>
<Card showGradientAccent>Accent top border</Card>`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card><p className="text-sm font-medium">Default</p><p className="text-xs text-muted-foreground mt-1">Standard card</p></Card>
              <Card variant="outline"><p className="text-sm font-medium">Outline</p><p className="text-xs text-muted-foreground mt-1">Thick border</p></Card>
              <Card variant="elevated"><p className="text-sm font-medium">Elevated</p><p className="text-xs text-muted-foreground mt-1">Shadow</p></Card>
              <Card variant="glass"><p className="text-sm font-medium">Glass</p><p className="text-xs text-muted-foreground mt-1">Frosted</p></Card>
            </div>
            <Card showGradientAccent className="mt-3"><p className="text-sm font-medium">Gradient Accent</p></Card>
          </Section>

          <Section id="page-header" title="PageHeader" code={`<PageHeader title="Your" gradientText="Agents"
  description="Deploy and monitor your AI fleet."
  action={<Button size="sm">New</Button>} />
<SectionHeader title="Activity" action={...} />`}>
            <Card>
              <PageHeader title="Your" gradientText="Agents" description="Deploy and monitor your AI fleet." action={<Button size="sm">New</Button>} />
              <div className="border-t border-border pt-3 mt-2">
                <SectionHeader title="Activity" action={<Button variant="ghost" size="sm">View All</Button>} />
              </div>
            </Card>
          </Section>

          <Section id="tabs" title="Tabs" code={`<Tabs defaultTab="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">...</TabsContent>
</Tabs>`}>
            <Sub title="Default">
              <Tabs defaultTab="overview">
                <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger><TabsTrigger value="settings">Settings</TabsTrigger></TabsList>
                <TabsContent value="overview"><Card><p className="text-sm text-muted-foreground">Overview content</p></Card></TabsContent>
                <TabsContent value="analytics"><Card><p className="text-sm text-muted-foreground">Analytics content</p></Card></TabsContent>
                <TabsContent value="settings"><Card><p className="text-sm text-muted-foreground">Settings content</p></Card></TabsContent>
              </Tabs>
            </Sub>
            <Sub title="Underline">
              <Tabs defaultTab="t1">
                <TabsList variant="underline"><TabsTrigger value="t1" variant="underline">Transcript</TabsTrigger><TabsTrigger value="t2" variant="underline">Sentiment</TabsTrigger></TabsList>
                <TabsContent value="t1"><p className="text-sm text-muted-foreground">Transcript view</p></TabsContent>
                <TabsContent value="t2"><p className="text-sm text-muted-foreground">Sentiment view</p></TabsContent>
              </Tabs>
            </Sub>
            <Sub title="Pills">
              <Tabs defaultTab="all">
                <TabsList variant="pills"><TabsTrigger value="all" variant="pills">All</TabsTrigger><TabsTrigger value="audio" variant="pills">Audio</TabsTrigger><TabsTrigger value="video" variant="pills">Video</TabsTrigger></TabsList>
                <TabsContent value="all"><p className="text-sm text-muted-foreground">All media</p></TabsContent>
                <TabsContent value="audio"><p className="text-sm text-muted-foreground">Audio only</p></TabsContent>
                <TabsContent value="video"><p className="text-sm text-muted-foreground">Video only</p></TabsContent>
              </Tabs>
            </Sub>
          </Section>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/*  DATA DISPLAY                                                      */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <CategoryHeader title="Data Display" />

          <Section id="table" title="Table" code={`<Table>
  <TableHeader><tr>
    <TableSortHead sortKey="name" activeSort={key} direction={dir} onSort={onSort}>Name</TableSortHead>
    <TableHead>Status</TableHead>
  </tr></TableHeader>
  <TableBody>
    <TableRow clickable>
      <TableCell>Interview</TableCell>
      <TableCell><Badge variant="success">Done</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>
<TablePagination page={1} pageSize={10} total={87} onPageChange={setPage} />`}>
            <Sub title="Sortable + Actions">
              <Table>
                <TableHeader>
                  <tr>
                    <TableSortHead sortKey="name" activeSort={sortKey} direction={sortDir} onSort={(k, d) => { setSortKey(d ? k : null); setSortDir(d); }}>Name</TableSortHead>
                    <TableSortHead sortKey="type" activeSort={sortKey} direction={sortDir} onSort={(k, d) => { setSortKey(d ? k : null); setSortDir(d); }}>Type</TableSortHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  <TableRow clickable><TableCell className="font-medium">Interview Recording</TableCell><TableCell>Audio</TableCell><TableCell><Badge variant="success">Done</Badge></TableCell><TableCell><TableActions><Tooltip content="Edit"><TableActionButton label="Edit"><I4 d={icons.pencil} /></TableActionButton></Tooltip><Tooltip content="Delete"><TableActionButton label="Delete" variant="danger"><I4 d={icons.trash} /></TableActionButton></Tooltip></TableActions></TableCell></TableRow>
                  <TableRow clickable><TableCell className="font-medium">Product Demo</TableCell><TableCell>Video</TableCell><TableCell><Badge variant="warning">Processing</Badge></TableCell><TableCell><TableActions><TableActionButton label="Edit"><I4 d={icons.pencil} /></TableActionButton></TableActions></TableCell></TableRow>
                </TableBody>
              </Table>
            </Sub>
            <Sub title="Pagination"><TablePagination page={tablePage} pageSize={pageSize} total={87} onPageChange={setTablePage} onPageSizeChange={setPageSize} /></Sub>
            <Sub title="Empty"><Table><TableHeader><tr><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead></tr></TableHeader><TableBody><TableEmpty colSpan={3} icon={<I d={icons.doc} />} title="No results found" description="Try adjusting your search." action={<Button size="sm" variant="outline">Clear Filters</Button>} /></TableBody></Table></Sub>
            <Sub title="Skeleton"><TableSkeleton rows={2} columns={4} /></Sub>
          </Section>

          <Section id="stat-card" title="StatCard" code={`<StatCardGrid>
  <StatCard icon={<ClockIcon />} iconColor="purple" label="Hours" value="1,234" />
  <StatCard variant="gradient" icon={...} label="Credits" value="$42" />
</StatCardGrid>`}>
            <StatCardGrid>
              <StatCard icon={<I d={icons.clock} />} iconColor="purple" label="Hours" value="1,234" />
              <StatCard icon={<I d={icons.doc} />} iconColor="blue" label="Docs" value="567" />
              <StatCard icon={<I d={icons.users} />} iconColor="green" label="Users" value="89" />
              <StatCard variant="gradient" icon={<I d={icons.screen} />} iconColor="purple" label="Credits" value="$42" />
            </StatCardGrid>
          </Section>

          <Section id="badge" title="Badge" code={`<Badge variant="success">Active</Badge>
<Badge color="purple">Custom</Badge>
<StatusBadge status="Active" />`}>
            <Sub title="Variants"><div className="flex flex-wrap gap-2"><Badge>Default</Badge><Badge variant="success">Success</Badge><Badge variant="warning">Warning</Badge><Badge variant="error">Error</Badge><Badge variant="info">Info</Badge><Badge variant="outline">Outline</Badge><Badge variant="secondary">Secondary</Badge></div></Sub>
            <Sub title="Colors"><div className="flex flex-wrap gap-2"><Badge color="green">Green</Badge><Badge color="yellow">Yellow</Badge><Badge color="red">Red</Badge><Badge color="blue">Blue</Badge><Badge color="purple">Purple</Badge><Badge color="pink">Pink</Badge><Badge color="orange">Orange</Badge><Badge color="gray">Gray</Badge></div></Sub>
            <Sub title="StatusBadge"><div className="flex flex-wrap gap-2"><StatusBadge status="Active" /><StatusBadge status="Pending" /><StatusBadge status="Failed" /><StatusBadge status="Completed" /></div></Sub>
          </Section>

          <Section id="info-card" title="InfoCard" code={`<InfoCard color="blue" title="Tip" description="Shortcuts make editing faster." />
<InfoCard color="red" title="Action" description="Cannot be undone." />`}>
            <div className="space-y-2">
              <InfoCard color="blue" title="Tip" description="Shortcuts make editing faster." />
              <InfoCard color="yellow" title="Warning" description="Trial expires in 3 days." />
              <InfoCard color="red" title="Action" description="Cannot be undone." />
              <InfoCard color="green" title="Success" description="All systems operational." />
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/*  FEEDBACK                                                          */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <CategoryHeader title="Feedback" />

          <Section id="toast" title="Toast" code={`const toast = useToast();
toast.success("Saved");                    // title only
toast.success("Saved", "Changes saved.");  // title + message
toast.error("Error", "Something went wrong.");`}>
            <p className="text-xs text-muted-foreground mb-3">Hover to pause. Errors persist 15s.</p>
            <ToastDemo />
          </Section>

          <Section id="dialog" title="Dialog & ConfirmDialog" code={`<ConfirmDialog
  open={open}
  onClose={() => setOpen(false)}
  onConfirm={handleDelete}
  title="Delete document?"
  description="This action cannot be undone."
  variant="danger"
  confirmLabel="Delete"
/>
{/* Legacy aliases: isOpen, message, confirmText, cancelText, onCancel */}`}>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>Open Dialog</Button>
              <Button size="sm" variant="danger" onClick={() => setConfirmOpen(true)}>Delete Item</Button>
            </div>
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
              <DialogHeader><h3 className="text-base font-semibold text-foreground">Edit Document</h3><DialogCloseButton onClose={() => setDialogOpen(false)} /></DialogHeader>
              <DialogBody><Input placeholder="Document name..." /><Textarea className="mt-3" placeholder="Description..." /></DialogBody>
              <DialogFooter><Button variant="ghost" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button><Button size="sm" onClick={() => setDialogOpen(false)}>Save</Button></DialogFooter>
            </Dialog>
            <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => setConfirmOpen(false)} title="Delete document?" description="This action cannot be undone." variant="danger" confirmLabel="Delete" />
          </Section>

          <Section id="empty-state" title="EmptyState" code={`<EmptyState icon={<DocIcon />} title="No documents"
  description="Upload your first document."
  action={<Button size="sm">Upload</Button>} />`}>
            <EmptyState icon={<I d={icons.doc} />} title="No documents" description="Upload your first document." action={<Button size="sm">Upload</Button>} height="sm" />
          </Section>

          <Section id="error-state" title="ErrorState" code={`<ErrorState variant="inline" message="Failed to load." onRetry={refetch} />
<ErrorState variant="card" title="Error" message="Could not fetch." onRetry={refetch} />`}>
            <div className="space-y-4">
              <ErrorState variant="inline" message="Failed to load transcript." onRetry={() => { }} />
              <Card><ErrorState variant="card" title="Load Failed" message="Could not fetch data." onRetry={() => { }} /></Card>
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/*  UTILITIES                                                         */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <CategoryHeader title="Utilities" />

          <Section id="dropdown" title="DropdownMenu" code={`<DropdownMenu trigger={<MoreButton />}>
  <DropdownMenuHeader>Actions</DropdownMenuHeader>
  <DropdownMenuItem>Edit</DropdownMenuItem>
  <DropdownMenuDivider />
  <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
</DropdownMenu>

{/* Triggerless: omit trigger, control with open prop */}
<DropdownMenu open={open} onOpenChange={setOpen}>
  <DropdownMenuItem>Option A</DropdownMenuItem>
</DropdownMenu>`}>
            <Sub title="With trigger (recommended)">
              <DropdownMenu trigger={<MoreButton />} align="left">
                <DropdownMenuHeader>Actions</DropdownMenuHeader>
                <DropdownMenuItem>Edit</DropdownMenuItem>
                <DropdownMenuItem>Duplicate</DropdownMenuItem>
                <DropdownMenuDivider />
                <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
              </DropdownMenu>
            </Sub>
            <Sub title="Triggerless (legacy compat)">
              <div className="relative inline-block">
                <Button size="sm" variant="outline" onClick={() => setDropdownOpen(!dropdownOpen)}>Toggle Menu</Button>
                <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen} align="left">
                  <DropdownMenuItem onClick={() => setDropdownOpen(false)}>Option A</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDropdownOpen(false)}>Option B</DropdownMenuItem>
                </DropdownMenu>
              </div>
            </Sub>
          </Section>

          <Section id="tooltip" title="Tooltip" code={`<Tooltip content="Edit item" side="top">
  <Button variant="outline">Hover me</Button>
</Tooltip>`}>
            <div className="flex flex-wrap gap-3">
              <Tooltip content="Top tooltip" side="top"><Button variant="outline" size="sm">Top</Button></Tooltip>
              <Tooltip content="Bottom tooltip" side="bottom"><Button variant="outline" size="sm">Bottom</Button></Tooltip>
              <Tooltip content="Left tooltip" side="left"><Button variant="outline" size="sm">Left</Button></Tooltip>
              <Tooltip content="Right tooltip" side="right"><Button variant="outline" size="sm">Right</Button></Tooltip>
            </div>
          </Section>

          <Section id="avatar" title="Avatar" code={`<Avatar name="Vatsal Shah" size="lg" />
<Avatar name="Jane Doe" variant="rounded" />
<Avatar name="John" src="/john.jpg" />`}>
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name="Vatsal Shah" size="sm" />
              <Avatar name="Vatsal Shah" />
              <Avatar name="Vatsal Shah" size="lg" />
              <Avatar name="Jane Doe" size="lg" variant="rounded" />
              <Avatar name="John" src="https://api.dicebear.com/8.x/avataaars/svg?seed=John" size="lg" />
            </div>
          </Section>

          <Section id="progress" title="Progress" code={`<Progress value={65} />
<Progress value={45} variant="gradient" />
<Progress value={72} showLabel />`}>
            <div className="max-w-md space-y-4">
              <Progress value={65} />
              <Progress value={45} variant="gradient" />
              <Progress value={72} showLabel />
            </div>
          </Section>

          {/* ════════════════════════════════════════════════════════════════════ */}
          {/*  SKELETON                                                          */}
          {/* ════════════════════════════════════════════════════════════════════ */}
          <CategoryHeader title="Skeleton" />

          <Section id="skeleton" title="Loading Skeletons" code={`<Skeleton className="h-6 w-40" />
<SkeletonText lines={3} />
<GridSkeleton count={6} columns={3} />
<FormSkeleton fields={3} />          {/* flat fields */}
<FormSkeleton sections={2} />        {/* card-wrapped sections */}
<PageSkeleton showCards={true} cardCount={3} tableRows={3} />`}>
            <div className="space-y-6">
              <Sub title="Text"><div className="max-w-sm space-y-2"><Skeleton className="h-6 w-40" /><SkeletonText lines={3} /></div></Sub>
              <Sub title="Grid"><GridSkeleton count={6} columns={3} /></Sub>
              <Sub title="Form (flat / sections)">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-muted-foreground mb-2">variant=&quot;flat&quot;</p><FormSkeleton fields={3} /></div>
                  <div><p className="text-[10px] text-muted-foreground mb-2">variant=&quot;sections&quot;</p><FormSkeleton sections={2} /></div>
                </div>
              </Sub>
              <Sub title="Page"><PageSkeleton showCards={true} cardCount={3} tableRows={3} /></Sub>

            </div>
          </Section>

          <footer className="mt-12 pt-6 border-t border-border text-center pb-6 space-y-1">
            <p className="text-xs text-muted-foreground">
              <a href="https://speakai.co?ref=design-system" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground hover:text-primary transition-colors">@speakai/ui</a>
              {" "} — 26 components
            </p>
            <p className="text-xs text-muted-foreground">
              <a href="https://github.com/speakai/ui" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
              {" · "}
              <a href="https://www.npmjs.com/package/@speakai/ui" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">npm</a>
            </p>
          </footer>
        </div>
      </SidebarLayout>

      <ConfigPanel config={config} onChange={applyConfig} open={configOpen} onClose={() => setConfigOpen(false)} />
    </>
  );
}

/* ─── Root ──────────────────────────────────────────────────────────────────── */

export default function Home() {
  return (
    <ToastProvider>
      <SidebarProvider>
        <div className="min-h-screen bg-background text-foreground font-sans">
          <DemoContent />
        </div>
      </SidebarProvider>
    </ToastProvider>
  );
}
