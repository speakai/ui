import { HTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "elevated" | "glass" | "gradient-border";
  showGradientAccent?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", showGradientAccent = false, children, ...props }, ref) => {
    const variants = {
      default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200",
      outlined: "bg-transparent border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200",
      elevated: "bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-200",
      glass: "bg-white/5 dark:bg-white/5 backdrop-blur-xl border border-white/10 dark:border-white/10 shadow-lg hover:bg-white/10 hover:border-purple-500/30 transition-all duration-200",
      "gradient-border": "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-transparent transition-all duration-200",
    };

    const needsRelative = showGradientAccent || variant === "gradient-border";

    return (
      <div
        ref={ref}
        className={cn("rounded-2xl p-6", needsRelative && "relative overflow-hidden", variants[variant], className)}
        {...props}
      >
        {showGradientAccent && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500" />
        )}
        {variant === "gradient-border" && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
        )}
        <div className={cn(needsRelative && "relative z-10")}>{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";
