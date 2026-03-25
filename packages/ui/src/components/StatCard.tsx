import { ReactNode } from "react";
import { cn } from "../utils/cn";

// ── Types ──────────────────────────────────────────────────────────────────────

export type IconColor = "purple" | "pink" | "blue" | "green" | "orange" | "red";

export interface StatCardProps {
  icon?: ReactNode;
  iconColor?: IconColor;
  label: string;
  value: string | number;
  variant?: "default" | "gradient";
  className?: string;
}

// ── Color Maps ─────────────────────────────────────────────────────────────────

const iconBgMap: Record<IconColor, string> = {
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
  pink: "bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
  orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  red: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
};

const gradientMap: Record<IconColor, string> = {
  purple: "from-purple-500/10 to-purple-600/5 dark:from-purple-500/20 dark:to-purple-600/10",
  pink: "from-pink-500/10 to-pink-600/5 dark:from-pink-500/20 dark:to-pink-600/10",
  blue: "from-blue-500/10 to-blue-600/5 dark:from-blue-500/20 dark:to-blue-600/10",
  green: "from-green-500/10 to-green-600/5 dark:from-green-500/20 dark:to-green-600/10",
  orange: "from-orange-500/10 to-orange-600/5 dark:from-orange-500/20 dark:to-orange-600/10",
  red: "from-red-500/10 to-red-600/5 dark:from-red-500/20 dark:to-red-600/10",
};

// ── StatCard ───────────────────────────────────────────────────────────────────

export const StatCard = ({
  icon,
  iconColor = "purple",
  label,
  value,
  variant = "default",
  className,
}: StatCardProps) => (
  <div
    className={cn(
      "rounded-2xl border p-6 transition-all duration-200",
      variant === "gradient"
        ? cn(
            "bg-gradient-to-br border-transparent",
            gradientMap[iconColor]
          )
        : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
      className
    )}
  >
    <div className="flex items-center gap-4">
      {icon && (
        <div
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            iconBgMap[iconColor]
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  </div>
);
StatCard.displayName = "StatCard";

// ── StatCardGrid ───────────────────────────────────────────────────────────────

export interface StatCardGridProps {
  columns?: 2 | 3 | 4;
  children: ReactNode;
  className?: string;
}

const gridColsMap = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
} as const;

export const StatCardGrid = ({ columns = 4, children, className }: StatCardGridProps) => (
  <div className={cn("grid gap-4", gridColsMap[columns], className)}>{children}</div>
);
StatCardGrid.displayName = "StatCardGrid";
