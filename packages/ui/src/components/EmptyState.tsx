import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  height?: "sm" | "md" | "lg";
}

const heightMap = {
  sm: "py-12",
  md: "py-20",
  lg: "py-28",
} as const;

// ── Component ──────────────────────────────────────────────────────────────────

export const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  (
    { icon, title, description, action, height = "md", className, ...props },
    ref
  ) => (
    <div
      ref={ref}
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/50 px-4 text-center transition-colors sm:px-6",
        heightMap[height],
        className
      )}
      {...props}
    >
      {icon && (
        <div
          aria-hidden="true"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
        >
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
);
EmptyState.displayName = "EmptyState";
