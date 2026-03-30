import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../utils/cn";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthDividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Text shown in the center of the divider (default "or") */
  text?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export const AuthDivider = forwardRef<HTMLDivElement, AuthDividerProps>(
  ({ className, text = "or", ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex w-full items-center gap-3 py-2",
        className,
      )}
      {...props}
    >
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase text-muted-foreground">
        {text}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  ),
);

AuthDivider.displayName = "AuthDivider";
