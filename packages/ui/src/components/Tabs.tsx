"use client";

import {
  createContext,
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Context ──────────────────────────────────────────────────────────────────

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (id: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs components must be used within a Tabs provider");
  return ctx;
}

// ── Tabs Root ────────────────────────────────────────────────────────────────

export interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  defaultTab: string;
  onTabChange?: (tab: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultTab, onTabChange, className, children, ...props }, ref) => {
    const [activeTab, setActiveTabState] = useState(defaultTab);

    const setActiveTab = useCallback(
      (id: string) => {
        setActiveTabState(id);
        onTabChange?.(id);
      },
      [onTabChange]
    );

    return (
      <TabsContext.Provider value={{ activeTab, setActiveTab }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

// ── TabsList ─────────────────────────────────────────────────────────────────

export interface TabsListProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "underline" | "pills";
}

const listVariantStyles = {
  default: "inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1",
  underline: "inline-flex items-center gap-4 border-b border-border",
  pills: "inline-flex flex-wrap items-center gap-2",
};

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ variant = "default", className, children, ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      className={cn(listVariantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  )
);
TabsList.displayName = "TabsList";

// ── TabsTrigger ──────────────────────────────────────────────────────────────

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  variant?: "default" | "underline" | "pills";
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  (
    { value, variant = "default", icon, badge, disabled = false, className, children, ...props },
    ref
  ) => {
    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    const triggerVariantStyles = {
      default: cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      ),
      underline: cn(
        "relative pb-3 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      ),
      pills: cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      ),
    };

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${value}`}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => setActiveTab(value)}
        className={cn(
          "inline-flex items-center gap-1.5",
          "disabled:pointer-events-none disabled:opacity-50",
          triggerVariantStyles[variant],
          className
        )}
        {...props}
      >
        {icon}
        {children}
        {badge && <span className="ml-1">{badge}</span>}
        {/* Underline indicator */}
        {variant === "underline" && isActive && (
          <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" aria-hidden="true" />
        )}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

// ── TabsContent ──────────────────────────────────────────────────────────────

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = forwardRef<HTMLDivElement, TabsContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { activeTab } = useTabsContext();

    if (activeTab !== value) return null;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`tabpanel-${value}`}
        tabIndex={0}
        className={cn("mt-4 animate-fade-in focus-visible:outline-none", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";
