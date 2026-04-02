"use client";

import {
  createContext,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
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
  /** When true, sidebar renders as a static element (for flexbox layouts). Default false = fixed positioning. */
  embedded?: boolean;
}

export const Sidebar = forwardRef<HTMLElement, SidebarProps>(
  ({ className, header, footer, sections, renderLink, embedded = false, ...props }, ref) => {
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
          <div className={cn(
            "group/header flex h-14 items-center shrink-0",
            collapsed ? "justify-center px-2" : "gap-2 px-3"
          )}>
            {/* Collapsed: show logo by default, panel icon on hover */}
            {collapsed && (
              <>
                <div className="group-hover/header:hidden">
                  {header}
                </div>
                <button
                  onClick={() => setCollapsed(false)}
                  className="hidden group-hover/header:flex rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Open sidebar"
                  title="Open sidebar"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M9 3v18" />
                  </svg>
                </button>
              </>
            )}
            {/* Expanded: logo + name on left, panel icon on right */}
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">{header}</div>
                <button
                  onClick={() => setCollapsed(true)}
                  className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring hidden md:flex shrink-0 ml-auto"
                  aria-label="Close sidebar"
                  title="Close sidebar"
                >
                  <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="3" />
                    <path d="M9 3v18" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}

        {/* Sections */}
        <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-2 py-3 scrollbar-hide" aria-label="Main navigation">
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
          <div className="shrink-0 border-t border-border p-3">
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
            "relative flex flex-col border-r border-border bg-card transition-[width] duration-200 ease-in-out overflow-hidden",
            embedded
              ? "h-full w-full"
              : cn(
                  "hidden md:flex h-screen fixed left-0 top-0 z-30",
                  collapsed ? "w-[60px]" : "w-[240px]"
                ),
            className
          )}
          {...props}
        >
          {sidebarContent}

          {/* Collapsed: click on border area to expand */}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute right-0 top-0 h-full w-2 cursor-pointer hover:bg-primary/10 transition-colors hidden md:block"
              aria-label="Open sidebar"
            />
          )}
        </aside>

        {/* Mobile backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-xs md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile drawer */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-[60] flex w-[min(280px,calc(100vw-3rem))] flex-col border-r border-border bg-card shadow-2xl transition-transform duration-200 ease-in-out md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Mobile close button */}
          <div className="absolute right-2 top-3">
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
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
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
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

// ── Collapsed Tooltip ───────────────────────────────────────────────────────

interface CollapsedTooltipProps {
  label: string;
}

function CollapsedTooltip({ label }: CollapsedTooltipProps) {
  return (
    <span className="pointer-events-none absolute left-full ml-2 hidden rounded-md border border-border bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-md group-hover:block whitespace-nowrap z-50">
      {label}
    </span>
  );
}

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
    "group relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-left transition-colors",
    "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
    item.active
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
    item.disabled && "pointer-events-none opacity-50",
    collapsed && "justify-center px-1.5",
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
    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center", collapsed && "h-5 w-5")}>
      {item.icon}
    </span>
  );

  const labelEl = !collapsed && (
    <span className="flex-1 truncate">{item.label}</span>
  );

  const badgeEl = !collapsed && item.badge && (
    <span className="shrink-0">{item.badge}</span>
  );

  const tooltipEl = collapsed && <CollapsedTooltip label={item.label} />;

  // Expandable parent
  if (hasChildren) {
    return (
      <li className={cn(collapsed && "relative")}>
        <button
          className={baseClasses}
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
        >
          {activeIndicator}
          {iconEl}
          {labelEl}
          {tooltipEl}
          {!collapsed && (
            <svg
              className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150", expanded && "rotate-90")}
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
      {tooltipEl}
    </>
  );

  if (item.href && renderLink) {
    return (
      <li className={cn(collapsed && "relative")}>
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
      <li className={cn(collapsed && "relative")}>
        <a
          href={item.href}
          className={baseClasses}
          onClick={onNavigate}
        >
          {content}
        </a>
      </li>
    );
  }

  return (
    <li className={cn(collapsed && "relative")}>
      <button
        className={baseClasses}
        onClick={() => {
          item.onClick?.();
          onNavigate();
        }}
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
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gradient-from to-gradient-to text-xs font-semibold text-primary-foreground">
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
