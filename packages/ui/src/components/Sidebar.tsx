"use client";

import {
  createContext,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────

export interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: ReactNode;
  active?: boolean;
  disabled?: boolean;
  children?: SidebarItem[];
}

export interface SidebarSection {
  id: string;
  label?: string;
  items: SidebarItem[];
}

// ── Context ──────────────────────────────────────────────────────────────────

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider");
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

export interface SidebarProviderProps {
  children: ReactNode;
  defaultCollapsed?: boolean;
  storageKey?: string;
}

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  storageKey = "sidebar-collapsed",
}: SidebarProviderProps) {
  const [collapsed, setCollapsedState] = useState(defaultCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) setCollapsedState(stored === "true");
    } catch {}
  }, [storageKey]);

  const setCollapsed = useCallback(
    (value: boolean) => {
      setCollapsedState(value);
      try {
        localStorage.setItem(storageKey, String(value));
      } catch {}
    },
    [storageKey]
  );

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}
SidebarProvider.displayName = "SidebarProvider";

// ── Sidebar Root ─────────────────────────────────────────────────────────────

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  header?: ReactNode;
  footer?: ReactNode;
  sections: SidebarSection[];
  /** Custom link renderer — return your framework's Link component */
  renderLink?: (props: { href: string; className: string; children: ReactNode; onClick?: () => void }) => ReactNode;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ className, header, footer, sections, renderLink, ...props }, ref) => {
    const { collapsed, setCollapsed, mobileOpen, setMobileOpen } = useSidebar();

    // Close mobile on Escape
    useEffect(() => {
      if (!mobileOpen) return;
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileOpen(false);
      };
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }, [mobileOpen, setMobileOpen]);

    // Lock body scroll on mobile open
    useEffect(() => {
      if (mobileOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [mobileOpen]);

    const sidebarContent = (
      <>
        {/* Header */}
        {header && (
          <div className="flex h-14 items-center gap-2 border-b border-border px-3 flex-shrink-0">
            {header}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="ml-auto hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    collapsed
                      ? "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
                      : "M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
                  }
                />
              </svg>
            </button>
          </div>
        )}

        {/* Sections */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-hide" aria-label="Main navigation">
          {sections.map((section, sIdx) => (
            <div key={section.id} className={cn(sIdx > 0 && "mt-4")}>
              {section.label && !collapsed && (
                <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.label}
                </p>
              )}
              {section.label && collapsed && (
                <div className="mx-auto my-2 h-px w-6 bg-border" aria-hidden="true" />
              )}
              <ul className="space-y-0.5" role="list">
                {section.items.map((item) => (
                  <SidebarNavItem key={item.id} item={item} collapsed={collapsed} renderLink={renderLink} onNavigate={() => setMobileOpen(false)} />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 border-t border-border p-3">
            {footer}
          </div>
        )}
      </>
    );

    return (
      <>
        {/* Desktop sidebar */}
        <aside
          ref={ref}
          className={cn(
            "hidden md:flex flex-col h-screen border-r border-border bg-card transition-[width] duration-200 ease-in-out fixed left-0 top-0 z-30",
            collapsed ? "w-[60px]" : "w-[240px]",
            className
          )}
          {...props}
        >
          {sidebarContent}
        </aside>

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 ease-in-out md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Mobile close button */}
          <div className="absolute right-2 top-3">
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close sidebar"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {sidebarContent}
        </aside>

        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>
          {header}
        </div>
      </>
    );
  }
);
Sidebar.displayName = "Sidebar";

// ── Nav Item ─────────────────────────────────────────────────────────────────

interface SidebarNavItemProps {
  item: SidebarItem;
  collapsed: boolean;
  renderLink?: SidebarProps["renderLink"];
  onNavigate: () => void;
  depth?: number;
}

function SidebarNavItem({ item, collapsed, renderLink, onNavigate, depth = 0 }: SidebarNavItemProps) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const baseClasses = cn(
    "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    item.active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
    item.disabled && "pointer-events-none opacity-50",
    collapsed && "justify-center px-0",
    depth > 0 && !collapsed && "ml-4 pl-4"
  );

  // Active indicator
  const activeIndicator = item.active && (
    <span
      className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-gradient-from to-gradient-to"
      aria-hidden="true"
    />
  );

  const iconEl = item.icon && (
    <span className={cn("flex h-5 w-5 flex-shrink-0 items-center justify-center", collapsed && "h-5 w-5")}>
      {item.icon}
    </span>
  );

  const labelEl = !collapsed && (
    <span className="flex-1 truncate">{item.label}</span>
  );

  const badgeEl = !collapsed && item.badge && (
    <span className="flex-shrink-0">{item.badge}</span>
  );

  // Expandable parent
  if (hasChildren) {
    return (
      <li>
        <button
          className={baseClasses}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          title={collapsed ? item.label : undefined}
        >
          {activeIndicator}
          {iconEl}
          {labelEl}
          {!collapsed && (
            <svg
              className={cn("h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-150", expanded && "rotate-90")}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </button>
        {expanded && !collapsed && item.children && (
          <ul className="mt-0.5 space-y-0.5" role="list">
            {item.children.map((child) => (
              <SidebarNavItem key={child.id} item={child} collapsed={collapsed} renderLink={renderLink} onNavigate={onNavigate} depth={depth + 1} />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // Link item
  const content = (
    <>
      {activeIndicator}
      {iconEl}
      {labelEl}
      {badgeEl}
    </>
  );

  if (item.href && renderLink) {
    return (
      <li>
        {renderLink({
          href: item.href,
          className: baseClasses,
          children: content,
          onClick: onNavigate,
        })}
      </li>
    );
  }

  if (item.href) {
    return (
      <li>
        <a
          href={item.href}
          className={baseClasses}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
        >
          {content}
        </a>
      </li>
    );
  }

  return (
    <li>
      <button
        className={baseClasses}
        onClick={() => {
          item.onClick?.();
          onNavigate();
        }}
        title={collapsed ? item.label : undefined}
      >
        {content}
      </button>
    </li>
  );
}
SidebarNavItem.displayName = "SidebarNavItem";

// ── Sidebar Layout Helper ────────────────────────────────────────────────────

export interface SidebarLayoutProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const SidebarLayout = forwardRef<HTMLDivElement, SidebarLayoutProps>(
  ({ className, children, ...props }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <div
        ref={ref}
        className={cn(
          "min-h-screen transition-[margin] duration-200 ease-in-out",
          "md:ml-[60px]",
          !collapsed && "md:ml-[240px]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
SidebarLayout.displayName = "SidebarLayout";

// ── Sidebar User Footer ─────────────────────────────────────────────────────

export interface SidebarUserProps {
  name: string;
  email?: string;
  avatar?: ReactNode;
  actions?: ReactNode;
}

export const SidebarUser = forwardRef<HTMLDivElement, SidebarUserProps & HTMLAttributes<HTMLDivElement>>(
  ({ name, email, avatar, actions, className, ...props }, ref) => {
    const { collapsed } = useSidebar();

    return (
      <div ref={ref} className={cn("flex items-center gap-3", collapsed && "justify-center", className)} {...props}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gradient-from to-gradient-to text-xs font-semibold text-primary-foreground">
          {avatar || name.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{name}</p>
            {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
          </div>
        )}
        {!collapsed && actions}
      </div>
    );
  }
);
SidebarUser.displayName = "SidebarUser";
