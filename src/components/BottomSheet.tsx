"use client";

import {
  forwardRef,
  ReactNode,
  HTMLAttributes,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "../utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────

export interface BottomSheetProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether the sheet is open */
  open: boolean;
  /** Called when the sheet should close (backdrop click, drag dismiss, Escape) */
  onClose: () => void;
  /** Snap point heights in pixels (ascending). The last value is the default open height. */
  snapPoints?: number[];
  /** Sheet content */
  children: ReactNode;
}

// ── Constants ────────────────────────────────────────────────────────────────

const DISMISS_THRESHOLD = 0.3; // drag down > 30% of sheet height → close
const TRANSITION_DURATION = "300ms";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

// ── BottomSheet ──────────────────────────────────────────────────────────────

export const BottomSheet = forwardRef<HTMLDivElement, BottomSheetProps>(
  ({ open, onClose, snapPoints, className, children, ...props }, ref) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
      startY: number;
      startTranslate: number;
      currentTranslate: number;
    } | null>(null);
    const [translateY, setTranslateY] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    // Track mounted state for enter animation
    const [mounted, setMounted] = useState(false);

    // Enter animation: render first, then flip mounted on next frame
    useEffect(() => {
      if (open) {
        // Reset translateY for fresh open
        setTranslateY(null);
        const rafId = requestAnimationFrame(() => {
          setMounted(true);
        });
        return () => cancelAnimationFrame(rafId);
      } else {
        setMounted(false);
      }
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

    // Lock body scroll
    useEffect(() => {
      if (open) {
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
          document.body.style.overflow = prev;
        };
      }
    }, [open]);

    // Focus trap: auto-focus first element and cycle Tab/Shift+Tab
    useEffect(() => {
      if (!open) return;

      const rafId = requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const focusableElements =
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          panel.setAttribute("tabindex", "-1");
          panel.focus();
        }
      });

      return () => cancelAnimationFrame(rafId);
    }, [open]);

    useEffect(() => {
      if (!open) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== "Tab") return;
        const panel = panelRef.current;
        if (!panel) return;
        const focusableElements =
          panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    // ── Touch drag handlers ────────────────────────────────────────────────

    const handleTouchStart = useCallback(
      (e: React.TouchEvent) => {
        const panel = panelRef.current;
        if (!panel) return;
        const touch = e.touches[0];
        dragRef.current = {
          startY: touch.clientY,
          startTranslate: translateY ?? 0,
          currentTranslate: translateY ?? 0,
        };
        setIsDragging(true);
      },
      [translateY]
    );

    const handleTouchMove = useCallback(
      (e: React.TouchEvent) => {
        if (!dragRef.current) return;
        const touch = e.touches[0];
        const delta = touch.clientY - dragRef.current.startY;
        // Only allow dragging downward (or back up to start position)
        const newTranslate = Math.max(
          0,
          dragRef.current.startTranslate + delta
        );
        dragRef.current.currentTranslate = newTranslate;
        setTranslateY(newTranslate);
      },
      []
    );

    const handleTouchEnd = useCallback(() => {
      if (!dragRef.current) return;
      const panel = panelRef.current;
      setIsDragging(false);

      if (panel) {
        const sheetHeight = panel.offsetHeight;
        const dragDistance = dragRef.current.currentTranslate;

        // If snap points provided, snap to nearest
        if (snapPoints && snapPoints.length > 0) {
          // Convert snap point heights to translateY values (distance from fully open)
          const maxHeight = snapPoints[snapPoints.length - 1];
          const snapTranslates = snapPoints
            .map((sp) => maxHeight - sp)
            .sort((a, b) => a - b);

          // Find nearest snap point
          let nearest = snapTranslates[0];
          let minDist = Math.abs(dragDistance - nearest);
          for (const st of snapTranslates) {
            const dist = Math.abs(dragDistance - st);
            if (dist < minDist) {
              minDist = dist;
              nearest = st;
            }
          }

          // If dragged past the lowest snap point by threshold, dismiss
          const lowestSnap = snapTranslates[snapTranslates.length - 1];
          if (dragDistance > lowestSnap + sheetHeight * DISMISS_THRESHOLD) {
            dragRef.current = null;
            setTranslateY(null);
            onClose();
            return;
          }

          dragRef.current = null;
          setTranslateY(nearest);
          return;
        }

        // No snap points: dismiss if dragged past threshold
        if (dragDistance > sheetHeight * DISMISS_THRESHOLD) {
          dragRef.current = null;
          setTranslateY(null);
          onClose();
          return;
        }
      }

      // Snap back
      dragRef.current = null;
      setTranslateY(0);
    }, [onClose, snapPoints]);

    // Close on backdrop click
    const handleBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
      },
      [onClose]
    );

    if (!open) return null;

    const sheetStyle: React.CSSProperties = {
      transform:
        mounted && translateY !== null
          ? `translateY(${translateY}px)`
          : mounted
            ? "translateY(0)"
            : "translateY(100%)",
      transition: isDragging
        ? "none"
        : `transform ${TRANSITION_DURATION} cubic-bezier(0.32, 0.72, 0, 1)`,
      maxHeight: snapPoints
        ? `${snapPoints[snapPoints.length - 1]}px`
        : undefined,
    };

    return (
      <div
        ref={overlayRef}
        className={cn(
          "fixed inset-0 z-[70] flex items-end justify-center bg-foreground/20 backdrop-blur-xs",
          mounted ? "opacity-100" : "opacity-0"
        )}
        style={{
          transition: `opacity ${TRANSITION_DURATION} ease`,
        }}
        onClick={handleBackdropClick}
      >
        <div
          ref={(node) => {
            (panelRef as React.MutableRefObject<HTMLDivElement | null>).current =
              node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLDivElement | null>).current =
                node;
            }
          }}
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-full max-h-[90dvh] flex flex-col rounded-t-xl border border-b-0 border-border bg-card shadow-xl overflow-hidden",
            className
          )}
          style={sheetStyle}
          {...props}
        >
          {/* Drag handle area */}
          <div
            className="flex shrink-0 items-center justify-center py-3 cursor-grab active:cursor-grabbing touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            aria-hidden="true"
          >
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    );
  }
);
BottomSheet.displayName = "BottomSheet";
