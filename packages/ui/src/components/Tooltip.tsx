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

export type TooltipSide = "top" | "bottom" | "left" | "right";

export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  content: ReactNode;
  side?: TooltipSide;
  delayMs?: number;
  disabled?: boolean;
  children: ReactNode;
}

// ── Opposite sides for flipping ─────────────────────────────────────────────

const oppositeSide: Record<TooltipSide, TooltipSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

// ── Component ────────────────────────────────────────────────────────────────

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      side = "top",
      delayMs = 300,
      disabled = false,
      children,
      className,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false);
    const [activeSide, setActiveSide] = useState<TooltipSide>(side);
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    const tooltipRef = useRef<HTMLDivElement>(null);

    // Reset activeSide when side prop changes or tooltip hides
    useEffect(() => {
      if (!visible) {
        setActiveSide(side);
      }
    }, [side, visible]);

    // Check viewport overflow and flip if needed
    useEffect(() => {
      if (!visible) return;

      // Use rAF to ensure the tooltip element is painted and measurable
      const rafId = requestAnimationFrame(() => {
        const el = tooltipRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        let shouldFlip = false;

        switch (side) {
          case "top":
            shouldFlip = rect.top < 0;
            break;
          case "bottom":
            shouldFlip = rect.bottom > window.innerHeight;
            break;
          case "left":
            shouldFlip = rect.left < 0;
            break;
          case "right":
            shouldFlip = rect.right > window.innerWidth;
            break;
        }

        if (shouldFlip) {
          setActiveSide(oppositeSide[side]);
        }
      });

      return () => cancelAnimationFrame(rafId);
    }, [visible, side]);

    const show = useCallback(() => {
      if (disabled) return;
      timerRef.current = setTimeout(() => setVisible(true), delayMs);
    }, [delayMs, disabled]);

    const hide = useCallback(() => {
      clearTimeout(timerRef.current);
      setVisible(false);
    }, []);

    useEffect(() => {
      return () => clearTimeout(timerRef.current);
    }, []);

    const positionClasses: Record<TooltipSide, string> = {
      top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
      left: "right-full top-1/2 -translate-y-1/2 mr-2",
      right: "left-full top-1/2 -translate-y-1/2 ml-2",
    };

    return (
      <div
        ref={ref}
        className={cn("relative inline-flex", className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        {...props}
      >
        {children}
        {visible && content && (
          <div
            ref={tooltipRef}
            role="tooltip"
            className={cn(
              "pointer-events-none absolute z-50 max-w-xs animate-fade-in",
              "rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs font-medium text-popover-foreground shadow-md",
              positionClasses[activeSide]
            )}
          >
            {content}
          </div>
        )}
      </div>
    );
  }
);
Tooltip.displayName = "Tooltip";
