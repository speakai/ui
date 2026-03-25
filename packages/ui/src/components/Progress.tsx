import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../utils/cn";

export type ProgressSize = "sm" | "default";
export type ProgressVariant = "default" | "gradient";

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: ProgressSize;
  variant?: ProgressVariant;
  showLabel?: boolean;
}

const trackSizes: Record<ProgressSize, string> = {
  sm: "h-1.5",
  default: "h-2.5",
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ value, size = "default", variant = "default", showLabel = false, className, ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-3", className)}
        {...props}
      >
        <div
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={100}
          className={cn(
            "w-full overflow-hidden rounded-full bg-muted",
            trackSizes[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300 ease-out",
              variant === "gradient"
                ? "bg-gradient-to-r from-gradient-from to-gradient-to"
                : "bg-primary"
            )}
            style={{ width: `${clampedValue}%` }}
          />
        </div>
        {showLabel && (
          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
            {Math.round(clampedValue)}%
          </span>
        )}
      </div>
    );
  }
);
Progress.displayName = "Progress";
