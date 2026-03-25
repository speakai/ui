import { ReactNode } from "react";
import { cn } from "../utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

export type InfoCardColor = "purple" | "blue" | "green" | "yellow" | "red" | "gray";

export interface InfoCardProps {
  color?: InfoCardColor;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

// ── Color Map ──────────────────────────────────────────────────────────────────

const colorMap: Record<InfoCardColor, string> = {
  purple:
    "border-purple-200 bg-purple-50 text-purple-800 dark:border-purple-800 dark:bg-purple-900/20 dark:text-purple-300",
  blue:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300",
  green:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300",
  yellow:
    "border-yellow-200 bg-yellow-50 text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
  red:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300",
  gray:
    "border-gray-200 bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300",
};

// ── Component ──────────────────────────────────────────────────────────────────

export const InfoCard = ({
  color = "blue",
  title,
  description,
  children,
  className,
}: InfoCardProps) => (
  <div
    className={cn(
      "rounded-xl border p-4 transition-all duration-200",
      colorMap[color],
      className
    )}
  >
    {title && <h4 className="text-sm font-semibold">{title}</h4>}
    {description && (
      <p className={cn("text-sm opacity-80", title && "mt-1")}>{description}</p>
    )}
    {children && <div className={cn((title || description) && "mt-3")}>{children}</div>}
  </div>
);
InfoCard.displayName = "InfoCard";
