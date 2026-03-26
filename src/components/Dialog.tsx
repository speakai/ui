"use client";

import {
  forwardRef,
  HTMLAttributes,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { cn } from "../utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────

export interface DialogProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onClose: () => void;
  size?: "sm" | "default" | "lg" | "xl" | "full";
}

export interface DialogHeaderProps extends HTMLAttributes<HTMLDivElement> {}
export interface DialogBodyProps extends HTMLAttributes<HTMLDivElement> {}
export interface DialogFooterProps extends HTMLAttributes<HTMLDivElement> {}

// ── Size Map ─────────────────────────────────────────────────────────────────

const sizeMap = {
  sm: "max-w-sm",
  default: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-[calc(100vw-2rem)]",
};

// ── Focusable selector ──────────────────────────────────────────────────────

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

// ── Dialog ───────────────────────────────────────────────────────────────────

export const Dialog = forwardRef<HTMLDivElement, DialogProps>(
  ({ open, onClose, size = "default", className, children, ...props }, ref) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

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
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
      };
    }, [open]);

    // Focus trap: auto-focus first element and cycle Tab/Shift+Tab
    useEffect(() => {
      if (!open) return;

      // Small delay to allow dialog content to render
      const rafId = requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;

        const focusableElements = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
        } else {
          // If no focusable elements, make the panel itself focusable
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

        const focusableElements = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [open]);

    // Close on backdrop click
    const handleBackdropClick = useCallback(
      (e: React.MouseEvent) => {
        if (e.target === overlayRef.current) onClose();
      },
      [onClose]
    );

    if (!open) return null;

    return (
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/20 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
      >
        <div
          ref={(node) => {
            // Support both internal ref and forwarded ref
            (panelRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          className={cn(
            "w-full rounded-lg border border-border bg-card shadow-xl animate-scale-in",
            sizeMap[size],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </div>
    );
  }
);
Dialog.displayName = "Dialog";

// ── DialogHeader ─────────────────────────────────────────────────────────────

export const DialogHeader = forwardRef<HTMLDivElement, DialogHeaderProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-start justify-between border-b border-border px-5 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
);
DialogHeader.displayName = "DialogHeader";

// ── DialogBody ───────────────────────────────────────────────────────────────

export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("px-5 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
);
DialogBody.displayName = "DialogBody";

// ── DialogFooter ─────────────────────────────────────────────────────────────

export const DialogFooter = forwardRef<HTMLDivElement, DialogFooterProps>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center justify-end gap-3 border-t border-border px-5 py-4", className)}
      {...props}
    >
      {children}
    </div>
  )
);
DialogFooter.displayName = "DialogFooter";

// ── DialogCloseButton ────────────────────────────────────────────────────────

export interface DialogCloseButtonProps extends HTMLAttributes<HTMLButtonElement> {
  onClose: () => void;
}

export const DialogCloseButton = forwardRef<HTMLButtonElement, DialogCloseButtonProps>(
  ({ onClose, className, ...props }, ref) => (
    <button
      ref={ref}
      onClick={onClose}
      aria-label="Close dialog"
      className={cn(
        "rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      {...props}
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  )
);
DialogCloseButton.displayName = "DialogCloseButton";
