import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "outline"
  | "secondary";

export type BadgeSize = "sm" | "default";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  info: "bg-info/10 text-info",
  outline: "border border-border bg-transparent text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  default: "px-2.5 py-1 text-xs",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", size = "default", children, ...props }, ref) => (
    <span
      ref={ref}
      role="status"
      className={cn(
        "inline-flex items-center rounded-full font-medium transition-colors",
        variantStyles[variant],
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
  error: "destructive",
  failed: "destructive",
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
