import { HTMLAttributes } from "react";
import { cn } from "../utils/cn";

// ── Skeleton ───────────────────────────────────────────────────────────────────

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton = ({ className, ...props }: SkeletonProps) => (
  <div
    className={cn("animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700", className)}
    {...props}
  />
);
Skeleton.displayName = "Skeleton";

// ── SkeletonText ───────────────────────────────────────────────────────────────

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText = ({ lines = 3, className }: SkeletonTextProps) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "h-3 animate-pulse rounded bg-gray-200 dark:bg-gray-700",
          i === lines - 1 && "w-3/4"
        )}
      />
    ))}
  </div>
);
SkeletonText.displayName = "SkeletonText";

// ── PageHeaderSkeleton ─────────────────────────────────────────────────────────

export const PageHeaderSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-3", className)}>
    <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
    <div className="h-4 w-72 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
  </div>
);
PageHeaderSkeleton.displayName = "PageHeaderSkeleton";

// ── StatCardSkeleton ───────────────────────────────────────────────────────────

export const StatCardSkeleton = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800",
      className
    )}
  >
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-6 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
      </div>
    </div>
  </div>
);
StatCardSkeleton.displayName = "StatCardSkeleton";

// ── StatCardsSkeletonGrid ──────────────────────────────────────────────────────

export interface StatCardsSkeletonGridProps {
  count?: number;
  className?: string;
}

export const StatCardsSkeletonGrid = ({ count = 4, className }: StatCardsSkeletonGridProps) => (
  <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
);
StatCardsSkeletonGrid.displayName = "StatCardsSkeletonGrid";

// ── PageSkeleton ───────────────────────────────────────────────────────────────

export const PageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-6", className)}>
    <PageHeaderSkeleton />
    <StatCardsSkeletonGrid />
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <SkeletonText lines={6} />
    </div>
  </div>
);
PageSkeleton.displayName = "PageSkeleton";

// ── CardSkeleton ───────────────────────────────────────────────────────────────

export interface CardSkeletonProps {
  variant?: "default" | "agent";
  className?: string;
}

export const CardSkeleton = ({ variant = "default", className }: CardSkeletonProps) => {
  if (variant === "agent") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800",
          className
        )}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
        <SkeletonText lines={2} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <div className="space-y-3">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <SkeletonText lines={3} />
      </div>
    </div>
  );
};
CardSkeleton.displayName = "CardSkeleton";

// ── GridSkeleton ───────────────────────────────────────────────────────────────

export interface GridSkeletonProps {
  columns?: 2 | 3 | 4;
  rows?: number;
  variant?: "default" | "agent";
  className?: string;
}

const gridColsMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;

export const GridSkeleton = ({ columns = 3, rows = 1, variant = "default", className }: GridSkeletonProps) => (
  <div className={cn("grid gap-4", gridColsMap[columns], className)}>
    {Array.from({ length: columns * rows }).map((_, i) => (
      <CardSkeleton key={i} variant={variant} />
    ))}
  </div>
);
GridSkeleton.displayName = "GridSkeleton";

// ── FormSkeleton ───────────────────────────────────────────────────────────────

export interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export const FormSkeleton = ({ fields = 4, className }: FormSkeletonProps) => (
  <div className={cn("space-y-5", className)}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
      </div>
    ))}
    <div className="flex justify-end pt-2">
      <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  </div>
);
FormSkeleton.displayName = "FormSkeleton";
