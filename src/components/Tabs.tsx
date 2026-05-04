"use client";

import {
  createContext,
  forwardRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
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
  /** Uncontrolled mode: seeds initial active tab. Ignored when `value` is provided. */
  defaultTab?: string;
  /** @deprecated Prefer `onValueChange`. Fires in uncontrolled mode when the active tab changes. */
  onTabChange?: (tab: string) => void;
  /** Controlled mode: active tab value. When provided, `defaultTab` is ignored. */
  value?: string;
  /** Fires in controlled mode when the user clicks a tab trigger. */
  onValueChange?: (tab: string) => void;
}

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ defaultTab, onTabChange, value, onValueChange, className, children, ...props }, ref) => {
    const isControlled = value !== undefined;

    // Warn in dev when both controlled and uncontrolled props are provided
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && isControlled && defaultTab !== undefined) {
        console.warn(
          "@speakai/ui/tabs: Both `value` (controlled) and `defaultTab` (uncontrolled) were provided. " +
          "`value` takes precedence; `defaultTab` is ignored."
        );
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [uncontrolledTab, setUncontrolledTabState] = useState(defaultTab ?? "");

    const activeTab = isControlled ? value : uncontrolledTab;

    const setActiveTab = useCallback(
      (id: string) => {
        if (isControlled) {
          onValueChange?.(id);
        } else {
          setUncontrolledTabState(id);
          onTabChange?.(id);
        }
      },
      [isControlled, onValueChange, onTabChange]
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
  /**
   * When true, the tab list scrolls horizontally on overflow.
   * A right-edge fade mask is applied and the scrollbar is hidden.
   * Default: false — no change to current layout behaviour.
   */
  scrollable?: boolean;
}

const listVariantStyles = {
  default: "inline-flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1",
  underline: "inline-flex items-center gap-4 border-b border-border",
  pills: "inline-flex flex-wrap items-center gap-2",
};

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ variant = "default", scrollable = false, className, children, ...props }, ref) => {
    const listRef = useRef<HTMLDivElement>(null);
    const { setActiveTab } = useTabsContext();

    const handleKeyDown = useCallback(
      (e: KeyboardEvent<HTMLDivElement>) => {
        const container = listRef.current;
        if (!container) return;

        const tabs = Array.from(
          container.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])')
        );
        if (tabs.length === 0) return;

        const currentIndex = tabs.indexOf(e.target as HTMLButtonElement);
        if (currentIndex === -1) return;

        let nextIndex: number | null = null;

        switch (e.key) {
          case "ArrowRight":
            nextIndex = (currentIndex + 1) % tabs.length;
            break;
          case "ArrowLeft":
            nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            break;
          case "Home":
            nextIndex = 0;
            break;
          case "End":
            nextIndex = tabs.length - 1;
            break;
          default:
            return;
        }

        e.preventDefault();
        const nextTab = tabs[nextIndex];
        nextTab.focus();

        // Select on focus (ARIA tabs pattern)
        const tabValue = nextTab.getAttribute("aria-controls")?.replace("tabpanel-", "");
        if (tabValue) {
          setActiveTab(tabValue);
        }
      },
      [setActiveTab]
    );

    return (
      <div
        ref={(node) => {
          (listRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        role="tablist"
        className={cn(
          listVariantStyles[variant],
          scrollable && [
            "overflow-x-auto",
            "[mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent_100%)]",
            "[&::-webkit-scrollbar]:hidden",
            "[scrollbar-width:none]",
          ],
          className
        )}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

// ── TabsTrigger ──────────────────────────────────────────────────────────────

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
  /**
   * @deprecated Pass `variant` on `TabsList` instead. This prop still works but
   * will emit a dev warning and will be removed in a future major version.
   */
  variant?: "default" | "underline" | "pills";
  icon?: ReactNode;
  badge?: ReactNode;
  disabled?: boolean;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  (rawProps, ref) => {
    const { value, variant = "default", icon, badge, disabled = false, className, children, ...props } = rawProps;

    // Warn in dev when variant is explicitly passed on TabsTrigger.
    // Pass variant on TabsList instead (context propagation is the forward path).
    useEffect(() => {
      if (process.env.NODE_ENV !== "production" && "variant" in rawProps) {
        console.warn(
          "@speakai/ui/tabs: variant on TabsTrigger is deprecated. Pass variant on TabsList instead."
        );
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { activeTab, setActiveTab } = useTabsContext();
    const isActive = activeTab === value;

    const triggerVariantStyles = {
      default: cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        isActive
          ? "bg-card text-foreground shadow-xs"
          : "text-muted-foreground hover:text-foreground"
      ),
      underline: cn(
        "relative pb-3 text-sm font-medium transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xs",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      ),
      pills: cn(
        "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
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
        className={cn("mt-4 animate-fade-in focus-visible:outline-hidden", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";
