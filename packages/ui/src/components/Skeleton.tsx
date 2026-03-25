import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../utils/cn";

// ── Skeleton ───────────────────────────────────────────────────────────────────

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-muted", className)}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

// ── SkeletonText ───────────────────────────────────────────────────────────────

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

const textWidthPattern = [
  "w-full",
  "w-11/12",
  "w-4/5",
  "w-full",
  "w-5/6",
  "w-3/4",
] as const;

export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  ({ lines = 3, className }, ref) => (
    <div ref={ref} aria-hidden="true" className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 animate-pulse rounded-lg bg-muted",
            i === lines - 1
              ? "w-3/4"
              : textWidthPattern[i % textWidthPattern.length]
          )}
        />
      ))}
    </div>
  )
);
SkeletonText.displayName = "SkeletonText";

// ── PageHeaderSkeleton ─────────────────────────────────────────────────────────

export const PageHeaderSkeleton = forwardRef<
  HTMLDivElement,
  { className?: string }
>(({ className }, ref) => (
  <div ref={ref} aria-hidden="true" className={cn("space-y-3", className)}>
    <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
    <div className="h-4 w-72 animate-pulse rounded-lg bg-muted" />
  </div>
));
PageHeaderSkeleton.displayName = "PageHeaderSkeleton";

// ── StatCardSkeleton ───────────────────────────────────────────────────────────

export const StatCardSkeleton = forwardRef<
  HTMLDivElement,
  { className?: string }
>(({ className }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn(
      "rounded-lg border border-border bg-card p-6",
      className
    )}
  >
    <div className="flex items-center gap-4">
      <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 animate-pulse rounded-lg bg-muted" />
        <div className="h-6 w-16 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  </div>
));
StatCardSkeleton.displayName = "StatCardSkeleton";

// ── StatCardsSkeletonGrid ──────────────────────────────────────────────────────

export interface StatCardsSkeletonGridProps {
  count?: number;
  className?: string;
}

export const StatCardsSkeletonGrid = forwardRef<
  HTMLDivElement,
  StatCardsSkeletonGridProps
>(({ count = 4, className }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn(
      "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
      className
    )}
  >
    {Array.from({ length: count }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
));
StatCardsSkeletonGrid.displayName = "StatCardsSkeletonGrid";

// ── PageSkeleton ───────────────────────────────────────────────────────────────

export const PageSkeleton = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("space-y-6", className)}
    >
      <PageHeaderSkeleton />
      <StatCardsSkeletonGrid />
      <div className="rounded-lg border border-border bg-card p-6">
        <SkeletonText lines={6} />
      </div>
    </div>
  )
);
PageSkeleton.displayName = "PageSkeleton";

// ── CardSkeleton ───────────────────────────────────────────────────────────────

export interface CardSkeletonProps {
  variant?: "default" | "agent";
  className?: string;
}

export const CardSkeleton = forwardRef<HTMLDivElement, CardSkeletonProps>(
  ({ variant = "default", className }, ref) => {
    if (variant === "agent") {
      return (
        <div
          ref={ref}
          aria-hidden="true"
          className={cn(
            "rounded-lg border border-border bg-card p-6",
            className
          )}
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 animate-pulse rounded-lg bg-muted" />
              <div className="h-3 w-20 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
          <SkeletonText lines={2} />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn(
          "rounded-lg border border-border bg-card p-6",
          className
        )}
      >
        <div className="space-y-3">
          <div className="h-5 w-40 animate-pulse rounded-lg bg-muted" />
          <SkeletonText lines={3} />
        </div>
      </div>
    );
  }
);
CardSkeleton.displayName = "CardSkeleton";

// ── GridSkeleton ───────────────────────────────────────────────────────────────

export interface GridSkeletonProps {
  columns?: 2 | 3 | 4;
  rows?: number;
  variant?: "default" | "agent";
  className?: string;
}

const gridColsMap = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

export const GridSkeleton = forwardRef<HTMLDivElement, GridSkeletonProps>(
  ({ columns = 3, rows = 1, variant = "default", className }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("grid gap-4", gridColsMap[columns], className)}
    >
      {Array.from({ length: columns * rows }).map((_, i) => (
        <CardSkeleton key={i} variant={variant} />
      ))}
    </div>
  )
);
GridSkeleton.displayName = "GridSkeleton";

// ── FormSkeleton ───────────────────────────────────────────────────────────────

export interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

const fieldWidthPattern = ["w-24", "w-20", "w-28", "w-16"] as const;

export const FormSkeleton = forwardRef<HTMLDivElement, FormSkeletonProps>(
  ({ fields = 4, className }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("space-y-5", className)}
    >
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div
            className={cn(
              "h-3 animate-pulse rounded-lg bg-muted",
              fieldWidthPattern[i % fieldWidthPattern.length]
            )}
          />
          <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
        </div>
      ))}
      <div className="flex justify-end pt-2">
        <div className="h-10 w-28 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  )
);
FormSkeleton.displayName = "FormSkeleton";
