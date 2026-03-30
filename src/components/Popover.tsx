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

// ── Position maps ────────────────────────────────────────────────────────────

type Side = "top" | "bottom" | "left" | "right";
type Align = "start" | "center" | "end";

const sideStyles: Record<Side, string> = {
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
  left: "right-full mr-2",
  right: "left-full ml-2",
};

const alignHorizontalStyles: Record<Align, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

const alignVerticalStyles: Record<Align, string> = {
  start: "top-0",
  center: "top-1/2 -translate-y-1/2",
  end: "bottom-0",
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface PopoverProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Element that triggers the popover */
  trigger: ReactNode;
  /** Popover content */
  children: ReactNode;
  /** Which side to position the popover */
  side?: Side;
  /** Alignment along the side axis */
  align?: Align;
  /** Controlled open state */
  open?: boolean;
  /** Called when open state changes */
  onOpenChange?: (open: boolean) => void;
}

// ── Popover ──────────────────────────────────────────────────────────────────

export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      className,
      trigger,
      children,
      side = "bottom",
      align = "center",
      open: controlledOpen,
      onOpenChange,
      ...props
    },
    ref,
  ) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : internalOpen;

    const setOpen = useCallback(
      (next: boolean) => {
        if (!isControlled) {
          setInternalOpen(next);
        }
        onOpenChange?.(next);
      },
      [isControlled, onOpenChange],
    );

    const handleToggle = useCallback(() => {
      setOpen(!isOpen);
    }, [isOpen, setOpen]);

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen, setOpen]);

    // Close on Escape
    useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setOpen(false);
        }
      };

      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, setOpen]);

    // Determine alignment styles based on side
    const isVerticalSide = side === "top" || side === "bottom";
    const alignStyles = isVerticalSide
      ? alignHorizontalStyles[align]
      : alignVerticalStyles[align];

    return (
      <div
        ref={ref}
        className={cn("relative inline-block", className)}
        {...props}
      >
        <div ref={containerRef}>
          {/* Trigger */}
          <div
            onClick={handleToggle}
            className="inline-flex cursor-pointer"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {trigger}
          </div>

          {/* Content */}
          {isOpen && (
            <div
              className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border border-border bg-card shadow-md",
                sideStyles[side],
                alignStyles,
              )}
              role="dialog"
            >
              {children}
            </div>
          )}
        </div>
      </div>
    );
  },
);

Popover.displayName = "Popover";
