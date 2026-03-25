import { ReactNode } from "react";
import { cn } from "../utils/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  height?: "sm" | "md" | "lg";
  className?: string;
}

const heightMap = {
  sm: "min-h-[200px]",
  md: "min-h-[320px]",
  lg: "min-h-[480px]",
} as const;

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  height = "md",
  className,
}: EmptyStateProps) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 p-8 text-center transition-all duration-200 dark:border-gray-600 dark:bg-gray-800/30",
      heightMap[height],
      className
    )}
  >
    {icon && (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500">
        {icon}
      </div>
    )}
    <div className="space-y-1">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    {action && <div className="mt-2">{action}</div>}
  </div>
);
EmptyState.displayName = "EmptyState";
