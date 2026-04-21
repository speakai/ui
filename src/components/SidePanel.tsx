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
}

// ── Size Map ─────────────────────────────────────────────────────────────────

const sizeMap: Record<SidePanelSize, string> = {
  sm: "w-full sm:w-80",
  default: "w-full sm:w-[420px]",
  lg: "w-full sm:w-[500px]",
  xl: "w-full sm:w-[640px]",
  full: "w-full",
};

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
      className,
      children,
      ...props
    },
    ref
  ) => {
    const panelRef = useRef<HTMLDivElement>(null);

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

    const isRight = side === "right";

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
            sizeMap[size],
            className
          )}
          {...props}
        >
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
