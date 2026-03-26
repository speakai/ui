import { HTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

export type CardVariant = "default" | "outline" | "elevated" | "glass";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  showGradientAccent?: boolean;
}

const variantStyles: Record<CardVariant, string> = {
  default:
    "bg-card text-card-foreground border border-border shadow-xs",
  outline:
    "bg-transparent border-2 border-border hover:border-border/80 transition-colors",
  elevated:
    "bg-card text-card-foreground border border-border shadow-lg hover:shadow-xl transition-shadow",
  glass:
    "bg-card/5 backdrop-blur-xl border border-border/10 shadow-lg hover:bg-card/10 transition-colors",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      showGradientAccent = false,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg p-6",
          showGradientAccent && "relative overflow-hidden",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        {showGradientAccent && (
          <div
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gradient-from via-gradient-to to-gradient-accent"
            aria-hidden="true"
          />
        )}
        {showGradientAccent ? (
          <div className="relative z-10">{children}</div>
        ) : (
          children
        )}
      </div>
    );
  },
);

Card.displayName = "Card";
