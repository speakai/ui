import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info" | "outline" | "secondary";
export type BadgeColor = "green" | "yellow" | "red" | "blue" | "purple" | "pink" | "orange" | "gray";
export type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Custom color — overrides variant */
  color?: BadgeColor;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-danger/10 text-danger",
  info: "bg-info/10 text-info",
  outline: "border border-border bg-transparent text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
};

const colorStyles: Record<BadgeColor, string> = {
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  yellow: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  gray: "bg-muted text-muted-foreground",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", color, size = "md", children, ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors",
        color ? colorStyles[color] : variantStyles[variant],
        sizeStyles[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  ),
);

Badge.displayName = "Badge";

// ── StatusBadge ───────────────────────────────────────────────────────────────

export interface StatusBadgeProps {
  status: string;
}

const statusVariantMap: Record<string, BadgeVariant> = {
  active: "success",
  completed: "success",
  success: "success",
  pending: "warning",
  processing: "warning",
  error: "error",
  failed: "error",
  inactive: "secondary",
};

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ status }, ref) => {
    const variant = statusVariantMap[status.toLowerCase()] ?? "default";
    return (
      <Badge ref={ref} variant={variant}>
        {status}
      </Badge>
    );
  },
);

StatusBadge.displayName = "StatusBadge";
