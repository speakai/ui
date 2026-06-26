"use client";

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────

export type SidePanelSide = "left" | "right";
export type SidePanelSize = "sm" | "default" | "lg" | "xl" | "full";

export interface SidePanelProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  side?: SidePanelSide;
  size?: SidePanelSize;
  /** Show backdrop overlay. Default true on mobile, configurable on desktop */
  backdrop?: boolean;
  /** Header content — replaces default title/back/close header when provided */
  header?: ReactNode;
  /** Footer content — sticky at bottom */
  footer?: ReactNode;
  /**
   * Opt-in expand/narrow width toggle. When true, the default header renders a
   * button (next to close) that swaps the panel width between `size` and
   * `expandedSize`. The choice is remembered in localStorage. No-op when a
   * custom `header` is supplied.
   */
  expandable?: boolean;
  /** Width to use while expanded. Defaults to one step wider than `size`. */
  expandedSize?: SidePanelSize;
  /**
   * Stable identifier for persisting the expanded choice in localStorage
   * (`sidepanel-expanded:<id>`). Falls back to `title` when omitted.
   */
  panelId?: string;
  /**
   * Opt-in drag-to-resize. When true, a handle on the panel's inner edge lets the
   * user drag the panel to any width — remembered per `panelId`
   * (`sidepanel-width:<id>`); double-click the handle to reset to the default.
   * Desktop only — the panel stays full-width on mobile. Adds no header icon.
   */
  resizable?: boolean;
  /** Minimum width in px while resizing (default 320). */
  minWidth?: number;
  /** Maximum width in px while resizing (default 880; also capped to the viewport). */
  maxWidth?: number;
  /** Starting width in px before the user drags (defaults to the `size` width). */
  defaultWidth?: number;
}

// ── Size Map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<SidePanelSize, string> = {
  sm: "w-full sm:w-80",
  default: "w-full sm:w-[420px]",
  lg: "w-full sm:w-[500px]",
  xl: "w-full sm:w-[640px]",
  full: "w-full",
};

/** Pixel widths matching `sizeMap`, used as the resize starting point. */
const sizePx: Record<SidePanelSize, number> = {
  sm: 320,
  default: 420,
  lg: 500,
  xl: 640,
  full: 880,
};

const WIDTH_STORAGE_PREFIX = "sidepanel-width:";

function readWidthPref(key: string | null): number | null {
  if (!key || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(WIDTH_STORAGE_PREFIX + key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeWidthPref(key: string | null, value: number): void {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(WIDTH_STORAGE_PREFIX + key, String(Math.round(value)));
  } catch {
    // Ignore — private mode / storage disabled.
  }
}

function clampWidth(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Order from narrowest to widest — used to pick a sensible default expanded size.
const SIZE_ORDER: SidePanelSize[] = ["sm", "default", "lg", "xl", "full"];

/** One step wider than `size`, capped at the widest ("full"). */
function widerSize(size: SidePanelSize): SidePanelSize {
  const next = SIZE_ORDER.indexOf(size) + 1;
  return SIZE_ORDER[Math.min(next, SIZE_ORDER.length - 1)];
}

const EXPANDED_STORAGE_PREFIX = "sidepanel-expanded:";

function readExpandedPref(key: string | null): boolean {
  if (!key || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(EXPANDED_STORAGE_PREFIX + key) === "1";
  } catch {
    return false;
  }
}

function writeExpandedPref(key: string | null, value: boolean): void {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(EXPANDED_STORAGE_PREFIX + key, value ? "1" : "0");
  } catch {
    // Ignore — private mode / storage disabled. Toggle still works in-session.
  }
}

// Matches the `duration-200` Tailwind class on the panel transition — used as a
// fallback so we still unmount if transitionend never fires (reduced-motion,
// tab hidden during close, etc.).
const TRANSITION_MS = 200;

// ── Component ────────────────────────────────────────────────────────────────

export const SidePanel = forwardRef<HTMLDivElement, SidePanelProps>(
  (
    {
      open,
      onClose,
      title,
      onBack,
      showBack = false,
      side = "right",
      size = "default",
      backdrop = true,
      header,
      footer,
      expandable = false,
      expandedSize,
      panelId,
      resizable = false,
      minWidth = 320,
      maxWidth = 880,
      defaultWidth,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const panelRef = useRef<HTMLDivElement>(null);
    const isRight = side === "right";

    // Expand/narrow width toggle (opt-in). Persisted per panel in localStorage.
    const storageKey = panelId ?? title ?? null;
    const [expanded, setExpanded] = useState(() =>
      expandable ? readExpandedPref(storageKey) : false
    );
    const resolvedExpandedSize = expandedSize ?? widerSize(size);
    const activeSize = expandable && expanded ? resolvedExpandedSize : size;

    const toggleExpanded = useCallback(() => {
      setExpanded((prev) => {
        const next = !prev;
        writeExpandedPref(storageKey, next);
        return next;
      });
    }, [storageKey]);

    // Drag-to-resize (opt-in). Free width in px, persisted per panel. Desktop only.
    const defaultPx = defaultWidth ?? sizePx[size];
    const [width, setWidth] = useState(() =>
      resizable ? readWidthPref(storageKey) ?? defaultPx : defaultPx
    );
    const widthRef = useRef(width);
    const [dragging, setDragging] = useState(false);

    const startResize = useCallback(
      (e: React.PointerEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startW = widthRef.current;
        setDragging(true);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        const onMove = (ev: PointerEvent) => {
          const dx = ev.clientX - startX;
          // Right-side panels grow when dragged left; left-side panels the reverse.
          const delta = isRight ? -dx : dx;
          const cap = Math.min(maxWidth, window.innerWidth - 80);
          const next = clampWidth(startW + delta, minWidth, cap);
          widthRef.current = next;
          setWidth(next);
        };
        const onUp = () => {
          setDragging(false);
          document.body.style.userSelect = "";
          document.body.style.cursor = "";
          writeWidthPref(storageKey, widthRef.current);
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      },
      [isRight, minWidth, maxWidth, storageKey]
    );

    const resetWidth = useCallback(() => {
      widthRef.current = defaultPx;
      setWidth(defaultPx);
      writeWidthPref(storageKey, defaultPx);
    }, [defaultPx, storageKey]);

    // Mount lifecycle: we want the panel out of the DOM (no children rendered,
    // no aria-modal dialog in the tree) when closed, but we also want the
    // slide-out animation to play on close. `isMounted` is true while open OR
    // while the closing transition is running. `isVisible` drives the transform:
    // it lags one frame behind mount on open so the initial off-screen state
    // commits before we transition to on-screen.
    const [isMounted, setIsMounted] = useState(open);
    const [isVisible, setIsVisible] = useState(open);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
      if (open) {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
        setIsMounted(true);
        // Flip to visible on the next frame so the off-screen transform
        // commits first, then transitions in.
        const frame = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(frame);
      }

      // Closing: start the slide-out, unmount once the transition finishes.
      setIsVisible(false);
      closeTimerRef.current = setTimeout(() => {
        setIsMounted(false);
        closeTimerRef.current = null;
      }, TRANSITION_MS + 20);
      return () => {
        if (closeTimerRef.current) {
          clearTimeout(closeTimerRef.current);
          closeTimerRef.current = null;
        }
      };
    }, [open]);

    // Close on Escape
    useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open, onClose]);

    // Click-outside detection when backdrop is disabled
    useEffect(() => {
      if (!open || backdrop) return;

      const handleClickOutside = (e: MouseEvent) => {
        const panel = panelRef.current;
        if (panel && !panel.contains(e.target as Node)) {
          onClose();
        }
      };

      // Use mousedown so it fires before any focus changes
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open, backdrop, onClose]);

    // Lock body scroll when open with backdrop (modal mode)
    useEffect(() => {
      if (open && backdrop) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open, backdrop]);

    const handleBackdropClick = useCallback(() => {
      onClose();
    }, [onClose]);

    // Merge refs: forwarded ref + internal panelRef
    const setRefs = useCallback(
      (node: HTMLDivElement | null) => {
        (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      },
      [ref]
    );

    if (!isMounted) return null;

    return (
      <>
        {/* Backdrop */}
        {backdrop && (
          <div
            className={cn(
              "fixed inset-0 z-40 bg-foreground/20 backdrop-blur-xs transition-opacity duration-200",
              isVisible ? "opacity-100" : "pointer-events-none opacity-0"
            )}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        )}

        {/* Panel */}
        <div
          ref={setRefs}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          className={cn(
            "fixed inset-y-0 z-[60] flex flex-col border-border bg-card shadow-2xl transition-transform duration-200 ease-in-out",
            isRight ? "right-0 border-l" : "left-0 border-r",
            isVisible
              ? "translate-x-0"
              : isRight
                ? "translate-x-full"
                : "-translate-x-full",
            // Animate width alongside the slide transform only when expandable,
            // so the default (non-expandable) class output is unchanged.
            expandable && "transition-all",
            // Resizable panels follow a per-instance CSS-var width on desktop and
            // stay full-width on mobile; otherwise use the fixed size class.
            resizable ? "w-full sm:w-[var(--sp-w)]" : sizeMap[activeSize],
            className
          )}
          {...props}
          style={
            resizable
              ? {
                  ...(props.style as React.CSSProperties),
                  ["--sp-w" as string]: `${width}px`,
                }
              : props.style
          }
        >
          {/* Drag-to-resize handle on the panel's inner edge (desktop only) */}
          {resizable && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panel"
              onPointerDown={startResize}
              onDoubleClick={resetWidth}
              className={cn(
                "group/resize absolute inset-y-0 z-20 hidden w-2 cursor-col-resize touch-none select-none sm:block",
                isRight ? "left-0" : "right-0"
              )}
            >
              <span
                className={cn(
                  "absolute inset-y-0 w-px bg-border transition-colors group-hover/resize:bg-primary",
                  dragging && "bg-primary",
                  isRight ? "left-0" : "right-0"
                )}
              />
            </div>
          )}

          {/* Header */}
          {header || (title && (
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2 min-w-0">
                {showBack && onBack && (
                  <button
                    onClick={onBack}
                    aria-label="Go back"
                    className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                )}
                <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
              </div>
              <div className="flex items-center gap-1">
                {expandable && (
                  <button
                    type="button"
                    onClick={toggleExpanded}
                    aria-label={expanded ? "Narrow panel" : "Expand panel"}
                    aria-pressed={expanded}
                    className="hidden rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
                  >
                    {expanded ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9 4.5 4.5M9 9V5.25M9 9H5.25m9.75 0 4.5-4.5M15 9V5.25M15 9h3.75M9 15l-4.5 4.5M9 15v3.75M9 15H5.25M15 15l4.5 4.5M15 15v3.75M15 15h3.75" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                      </svg>
                    )}
                  </button>
                )}
                <button
                  onClick={onClose}
                  aria-label="Close panel"
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          {/* Body */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="shrink-0 border-t border-border px-4 py-3">
              {footer}
            </div>
          )}
        </div>
      </>
    );
  }
);
SidePanel.displayName = "SidePanel";
