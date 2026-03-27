import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

export type IconColor = "purple" | "pink" | "blue" | "green" | "orange" | "red";

export interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  iconColor?: IconColor;
  label: string;
  value: string | number;
  /** Optional class name applied to the value text (e.g. for custom colors) */
  valueClassName?: string;
  variant?: "default" | "gradient";
}

// ── Color Maps ─────────────────────────────────────────────────────────────────

const iconBgMap: Record<IconColor, string> = {
  purple:
    "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  pink:
    "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  blue:
    "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  green:
    "bg-green-500/10 text-green-600 dark:text-green-400",
  orange:
    "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  red:
    "bg-red-500/10 text-red-600 dark:text-red-400",
};

// ── StatCard ───────────────────────────────────────────────────────────────────

export const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  (
    {
      icon,
      iconColor = "purple",
      label,
      value,
      valueClassName,
      variant = "default",
      className,
      ...props
    },
    ref
  ) => {
    const isGradient = variant === "gradient";

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border p-4 sm:p-5 transition-colors",
          isGradient
            ? "border-transparent bg-gradient-to-br from-gradient-from to-gradient-to text-primary-foreground"
            : "border-border bg-card",
          className
        )}
        {...props}
      >
        {icon && (
          <div
            aria-hidden="true"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg",
              isGradient
                ? "bg-white/20 text-primary-foreground"
                : iconBgMap[iconColor]
            )}
          >
            {icon}
          </div>
        )}
        <p
          className={cn(
            "mt-3 text-xs font-medium uppercase tracking-wider",
            isGradient ? "text-primary-foreground/70" : "text-muted-foreground"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "mt-1 text-xl font-semibold",
            isGradient ? "text-primary-foreground" : "text-foreground",
            valueClassName
          )}
        >
          {value}
        </p>
      </div>
    );
  }
);
StatCard.displayName = "StatCard";

// ── StatCardGrid ───────────────────────────────────────────────────────────────

export interface StatCardGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 2 | 3 | 4;
  children: ReactNode;
}

const gridColsMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

export const StatCardGrid = forwardRef<HTMLDivElement, StatCardGridProps>(
  ({ columns = 4, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid gap-4", gridColsMap[columns], className)}
      {...props}
    >
      {children}
    </div>
  )
);
StatCardGrid.displayName = "StatCardGrid";
