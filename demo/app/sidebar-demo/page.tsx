"use client";

import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarProvider,
  SidebarLayout,
  SidebarUser,
  useSidebar,
  Badge,
  Button,
  Card,
  StatCard,
  StatCardGrid,
  PageHeader,
  cn,
} from "@speakai/ui";
import type { SidebarSection } from "@speakai/ui";

/* ─── Icons (inline SVGs for demo) ──────────────────────────────────────────── */

function I({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const p = {
  home: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  agents: "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z",
  chat: "M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155",
  bell: "M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0",
  phone: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z",
  cog: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z",
  users: "M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z",
  doc: "M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z",
  folder: "M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z",
};

/* ─── Sample Sections ───────────────────────────────────────────────────────── */

function useSampleSections(): SidebarSection[] {
  const [activePath, setActivePath] = useState("/dashboard");

  return [
    {
      id: "main",
      items: [
        { id: "dashboard", label: "Dashboard", icon: <I d={p.home} />, href: "/dashboard", active: activePath === "/dashboard", onClick: () => setActivePath("/dashboard") },
        { id: "agents", label: "Agents", icon: <I d={p.agents} />, href: "/agents", active: activePath === "/agents", onClick: () => setActivePath("/agents"), badge: <Badge variant="info" size="sm">3</Badge> },
        { id: "conversations", label: "Conversations", icon: <I d={p.chat} />, href: "/conversations", active: activePath === "/conversations", onClick: () => setActivePath("/conversations") },
        { id: "notifications", label: "Notifications", icon: <I d={p.bell} />, href: "/notifications", active: activePath === "/notifications", onClick: () => setActivePath("/notifications"), badge: <Badge variant="destructive" size="sm">5</Badge> },
      ],
    },
    {
      id: "manage",
      label: "Manage",
      items: [
        { id: "phone", label: "Phone Numbers", icon: <I d={p.phone} />, href: "/phone", active: activePath === "/phone", onClick: () => setActivePath("/phone") },
        { id: "team", label: "Team", icon: <I d={p.users} />, href: "/team", active: activePath === "/team", onClick: () => setActivePath("/team") },
        {
          id: "folders",
          label: "Folders",
          icon: <I d={p.folder} />,
          children: [
            { id: "f1", label: "Marketing", href: "/folders/marketing", active: activePath === "/folders/marketing", onClick: () => setActivePath("/folders/marketing") },
            { id: "f2", label: "Engineering", href: "/folders/engineering", active: activePath === "/folders/engineering", onClick: () => setActivePath("/folders/engineering") },
            { id: "f3", label: "Sales Calls", href: "/folders/sales", active: activePath === "/folders/sales", onClick: () => setActivePath("/folders/sales") },
          ],
        },
        { id: "docs", label: "Documents", icon: <I d={p.doc} />, href: "/docs", active: activePath === "/docs", onClick: () => setActivePath("/docs") },
        { id: "settings", label: "Settings", icon: <I d={p.cog} />, href: "/settings", active: activePath === "/settings", onClick: () => setActivePath("/settings") },
      ],
    },
  ];
}

/* ─── Theme Toggle ──────────────────────────────────────────────────────────── */

function ThemeBtn() {
  const { theme, setTheme } = useTheme();
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  if (!m) return null;
  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      aria-label="Toggle theme"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d={theme === "dark"
          ? "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
          : "M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
        } />
      </svg>
    </button>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

function SidebarDemoContent() {
  const sections = useSampleSections();

  return (
    <>
      <Sidebar
        header={
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gradient-from to-gradient-to">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-foreground">Speak AI</span>
          </div>
        }
        sections={sections}
        footer={
          <div className="space-y-3">
            <SidebarUser
              name="Vatsal Shah"
              email="vatsal@speakai.co"
              actions={<ThemeBtn />}
            />
          </div>
        }
      />

      <SidebarLayout>
        <div className="p-4 sm:p-8">
          <PageHeader
            title="Dashboard"
            description="Welcome back. Here is what is happening today."
          />

          <StatCardGrid className="mb-8">
            <StatCard
              icon={<I d={p.doc} />}
              iconColor="purple"
              label="Total Documents"
              value="1,234"
            />
            <StatCard
              icon={<I d={p.chat} />}
              iconColor="blue"
              label="Conversations"
              value="567"
            />
            <StatCard
              icon={<I d={p.users} />}
              iconColor="green"
              label="Team Members"
              value="12"
            />
            <StatCard
              variant="gradient"
              icon={<I d={p.agents} />}
              iconColor="purple"
              label="Active Agents"
              value="8"
            />
          </StatCardGrid>

          <Card>
            <h3 className="text-base font-semibold text-foreground mb-3">Sidebar Features</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Collapsible on desktop (click the icon in header)</li>
              <li>Mobile drawer with backdrop (resize browser to see)</li>
              <li>Active route indicator with gradient bar</li>
              <li>Expandable sections (click Folders)</li>
              <li>Badge support on nav items</li>
              <li>User avatar footer with gradient</li>
              <li>Collapse state persisted to localStorage</li>
              <li>Full keyboard navigation and ARIA attributes</li>
              <li>Semantic tokens — adapts to theme changes</li>
              <li>Custom link renderer for Next.js/React Router</li>
            </ul>
          </Card>

          <div className="mt-6">
            <Button onClick={() => window.location.href = "/"}>
              Back to Component Gallery
            </Button>
          </div>
        </div>
      </SidebarLayout>
    </>
  );
}

export default function SidebarDemoPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-background text-foreground font-sans">
        <SidebarDemoContent />
      </div>
    </SidebarProvider>
  );
}
