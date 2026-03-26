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

export interface PageSkeletonProps {
  /** Show stat card skeletons. Default true. */
  showCards?: boolean;
  /** Number of stat cards. Default 4. */
  cardCount?: number;
  /** Number of table-like rows in the content area. Default 5. */
  tableRows?: number;
  className?: string;
}

export const PageSkeleton = forwardRef<HTMLDivElement, PageSkeletonProps>(
  ({ showCards = true, cardCount = 4, tableRows = 5, className }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn("space-y-6", className)}
    >
      <PageHeaderSkeleton />
      {showCards && <StatCardsSkeletonGrid count={cardCount} />}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="divide-y divide-border">
          {Array.from({ length: tableRows }).map((_, i) => (
            <div key={i} className="h-14 animate-pulse bg-muted/30" />
          ))}
        </div>
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
  /** Number of grid rows. Total cards = rows × columns. Ignored when `count` is provided. */
  rows?: number;
  /** Total number of cards to render. Takes precedence over `rows`. */
  count?: number;
  variant?: "default" | "agent";
  className?: string;
}

const gridColsMap = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

export const GridSkeleton = forwardRef<HTMLDivElement, GridSkeletonProps>(
  ({ columns = 3, rows = 1, count, variant = "default", className }, ref) => {
    const total = count ?? columns * rows;
    return (
      <div
        ref={ref}
        aria-hidden="true"
        className={cn("grid gap-4", gridColsMap[columns], className)}
      >
        {Array.from({ length: total }).map((_, i) => (
          <CardSkeleton key={i} variant={variant} />
        ))}
      </div>
    );
  }
);
GridSkeleton.displayName = "GridSkeleton";

// ── FormSkeleton ───────────────────────────────────────────────────────────────

export interface FormSkeletonProps {
  /** Number of individual form fields (flat variant). Default 4. */
  fields?: number;
  /** Number of card-wrapped sections (sections variant). Alias for switching to sections mode. */
  sections?: number;
  /** "flat" renders label+input pairs. "sections" renders card-wrapped groups. Default "flat", or "sections" when `sections` prop is provided. */
  variant?: "flat" | "sections";
  className?: string;
}

const fieldWidthPattern = ["w-24", "w-20", "w-28", "w-16"] as const;

export const FormSkeleton = forwardRef<HTMLDivElement, FormSkeletonProps>(
  ({ fields = 4, sections, variant: variantProp, className }, ref) => {
    const variant = variantProp ?? (sections != null ? "sections" : "flat");

    if (variant === "sections") {
      const sectionCount = sections ?? fields;
      return (
        <div ref={ref} aria-hidden="true" className={cn("space-y-6", className)}>
          {Array.from({ length: sectionCount }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-6">
              <div className="h-5 w-40 animate-pulse rounded-lg bg-muted mb-5" />
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded-lg bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded-lg bg-muted" />
                  <div className="h-10 w-full animate-pulse rounded-lg bg-muted" />
                </div>
                {i === 0 && (
                  <div className="space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded-lg bg-muted" />
                    <div className="h-24 w-full animate-pulse rounded-lg bg-muted" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
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
    );
  }
);
FormSkeleton.displayName = "FormSkeleton";

// ── DetailSkeleton ──────────────────────────────────────────────────────────────

export interface DetailSkeletonProps {
  className?: string;
}

export const DetailSkeleton = forwardRef<HTMLDivElement, DetailSkeletonProps>(
  ({ className }, ref) => (
    <div ref={ref} aria-hidden="true" className={cn("mx-auto max-w-6xl", className)}>
      {/* Back link */}
      <div className="mb-6 h-5 w-32 animate-pulse rounded-lg bg-muted" />

      {/* Main card */}
      <div className="rounded-lg border border-border bg-card p-8">
        {/* Header with avatar and actions */}
        <div className="mb-6 flex items-start justify-between border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 animate-pulse rounded-full bg-muted" />
            <div>
              <div className="mb-2 h-8 w-48 animate-pulse rounded-lg bg-muted" />
              <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
            <div className="h-10 w-24 animate-pulse rounded-lg bg-muted" />
          </div>
        </div>

        <div className="space-y-8">
          {/* Section 1 — info grid */}
          <div>
            <div className="mb-4 h-6 w-32 animate-pulse rounded-lg bg-muted" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-muted/30 p-4">
                  <div className="mb-2 h-4 w-24 animate-pulse rounded-lg bg-muted" />
                  <div className="h-5 w-32 animate-pulse rounded-lg bg-muted" />
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Section 2 — description + grid */}
          <div>
            <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-muted" />
            <div className="mb-4 rounded-lg bg-muted/30 p-4">
              <div className="mb-2 h-4 w-full animate-pulse rounded-lg bg-muted" />
              <div className="h-4 w-3/4 animate-pulse rounded-lg bg-muted" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="mb-2 h-4 w-32 animate-pulse rounded-lg bg-muted" />
                <div className="h-5 w-24 animate-pulse rounded-lg bg-muted" />
              </div>
              <div className="rounded-lg bg-muted/30 p-4">
                <div className="mb-2 h-4 w-28 animate-pulse rounded-lg bg-muted" />
                <div className="h-5 w-20 animate-pulse rounded-lg bg-muted" />
              </div>
            </div>
          </div>

          <div className="border-t border-border" />

          {/* Action button */}
          <div className="border-t border-border pt-6">
            <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
);
DetailSkeleton.displayName = "DetailSkeleton";
