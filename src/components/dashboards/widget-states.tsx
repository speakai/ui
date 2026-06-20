/**
 * Uniform loading / error / empty primitives shared by the presentational
 * dashboard widgets, so every widget handles its async states identically.
 */

import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { Skeleton } from "../Skeleton";
import { ErrorState } from "../ErrorState";
import { EmptyState } from "../EmptyState";
import { TrendingUpIcon, TrendingDownIcon } from "./icons";
import type { WidgetCommonLabels } from "./types";

/** A full-bleed skeleton block at a widget-appropriate height. */
export function WidgetSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn("h-72 w-full rounded-xl", className)} />;
}

/** The card-variant error state with an optional retry, fed from injected labels. */
export function WidgetError({
  labels,
  onRetry,
}: {
  labels?: WidgetCommonLabels;
  onRetry?: () => void;
}) {
  return (
    <ErrorState
      variant="card"
      title={labels?.errorTitle}
      message={labels?.errorMessage}
      retryLabel={labels?.retryLabel}
      onRetry={onRetry}
    />
  );
}

/** A small empty state sized for a widget body. */
export function WidgetEmpty({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <EmptyState icon={icon} title={title} description={description} height="sm" />
  );
}

/**
 * Coloured ▲/▼ delta caption. `noChangeLabel` renders when the delta is zero or
 * null; otherwise `deltaLabel(sign, value)` builds the change string (the host
 * owns the wording — e.g. "+1.2K vs previous period").
 */
export function DeltaCaption({
  delta,
  format,
  noChangeLabel,
  deltaLabel,
  className,
}: {
  delta: number | null;
  format: (n: number) => string;
  noChangeLabel: string;
  deltaLabel: (sign: string, value: string) => string;
  className?: string;
}) {
  if (delta == null || delta === 0) {
    return (
      <p className={cn("text-xs text-muted-foreground", className)}>
        {noChangeLabel}
      </p>
    );
  }
  const positive = delta > 0;
  const Icon = positive ? TrendingUpIcon : TrendingDownIcon;
  return (
    <p
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        positive ? "text-success" : "text-destructive",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {deltaLabel(positive ? "+" : "−", format(Math.abs(delta)))}
    </p>
  );
}
