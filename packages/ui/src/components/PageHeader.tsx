import { ReactNode } from "react";
import { cn } from "../utils/cn";

// ── PageHeader ─────────────────────────────────────────────────────────────────

export interface PageHeaderProps {
  title: string;
  gradientText?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const PageHeader = ({
  title,
  gradientText,
  description,
  action,
  className,
}: PageHeaderProps) => (
  <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
    <div className="space-y-1">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        {title}
        {gradientText && (
          <>
            {" "}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {gradientText}
            </span>
          </>
        )}
      </h1>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    {action && <div className="mt-3 sm:mt-0">{action}</div>}
  </div>
);
PageHeader.displayName = "PageHeader";

// ── SectionHeader ──────────────────────────────────────────────────────────────

export interface SectionHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const SectionHeader = ({
  title,
  description,
  action,
  className,
}: SectionHeaderProps) => (
  <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between", className)}>
    <div className="space-y-0.5">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
    {action && <div className="mt-2 sm:mt-0">{action}</div>}
  </div>
);
SectionHeader.displayName = "SectionHeader";
