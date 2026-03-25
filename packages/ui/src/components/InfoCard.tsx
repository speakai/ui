import { forwardRef, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

export type InfoCardColor = "purple" | "blue" | "green" | "yellow" | "red" | "gray";

export interface InfoCardProps extends HTMLAttributes<HTMLDivElement> {
  color?: InfoCardColor;
  title?: string;
  description?: string;
  children?: ReactNode;
}

// ── Color Map ──────────────────────────────────────────────────────────────────

const colorMap: Record<InfoCardColor, string> = {
  purple:
    "bg-purple-500/10 border-purple-500/20 text-purple-700 dark:text-purple-300",
  blue:
    "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-300",
  green:
    "bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-300",
  yellow:
    "bg-yellow-500/10 border-yellow-500/20 text-yellow-700 dark:text-yellow-300",
  red:
    "bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300",
  gray:
    "bg-muted/50 border-border text-foreground",
};

// ── Component ──────────────────────────────────────────────────────────────────

export const InfoCard = forwardRef<HTMLDivElement, InfoCardProps>(
  ({ color = "blue", title, description, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border p-4 transition-colors sm:p-6",
        colorMap[color],
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          {title && <h4 className="font-semibold">{title}</h4>}
          {description && (
            <p className={cn("text-sm opacity-80", title && "mt-1")}>
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className={cn((title || description) && "mt-3")}>{children}</div>
      )}
    </div>
  )
);
InfoCard.displayName = "InfoCard";
