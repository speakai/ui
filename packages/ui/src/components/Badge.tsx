import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "default";
export type BadgeColor = "green" | "yellow" | "red" | "blue" | "purple" | "pink" | "orange" | "gray";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  color?: BadgeColor;
  size?: "sm" | "md";
}

const variantColors: Record<BadgeVariant, string> = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const colorClasses: Record<BadgeColor, string> = {
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
};

const sizeClasses = { sm: "text-xs px-2 py-0.5", md: "text-xs px-2.5 py-1" };

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", color, size = "md", children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn("inline-flex items-center rounded-full font-medium", sizeClasses[size], color ? colorClasses[color] : variantColors[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
);
Badge.displayName = "Badge";

export const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, BadgeVariant> = {
    active: "success", completed: "success", success: "success",
    pending: "warning", processing: "warning",
    error: "error", failed: "error",
    inactive: "default",
  };
  return <Badge variant={map[status.toLowerCase()] || "default"}>{status}</Badge>;
};
StatusBadge.displayName = "StatusBadge";
