import { HTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "../utils/cn";

export interface AuthCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Optional logo element rendered above the title. */
  logo?: ReactNode;
  /** Main heading text. */
  title: string;
  /** Optional description below the title. */
  subtitle?: string;
}

export const AuthCard = forwardRef<HTMLDivElement, AuthCardProps>(
  ({ className, logo, title, subtitle, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg",
          className,
        )}
        {...props}
      >
        {logo && (
          <div className="mb-6 flex justify-center">{logo}</div>
        )}
        <h1 className="text-center text-2xl font-semibold text-card-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
        <div className="mt-6">{children}</div>
      </div>
    );
  },
);

AuthCard.displayName = "AuthCard";
