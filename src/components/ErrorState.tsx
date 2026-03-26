"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "../utils/cn";
import { Button } from "./Button";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "page" | "card" | "inline";
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const WarningIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={cn("h-6 w-6", className)}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
    />
  </svg>
);

const RetryIcon = () => (
  <svg
    aria-hidden="true"
    className="h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
    />
  </svg>
);

// ── Component ──────────────────────────────────────────────────────────────────

export const ErrorState = forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      variant = "card",
      title = "Something went wrong",
      message = "An unexpected error occurred. Please try again.",
      onRetry,
      retryLabel = "Try again",
      className,
      ...props
    },
    ref
  ) => {
    const retryButton = onRetry ? (
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RetryIcon />
        {retryLabel}
      </Button>
    ) : null;

    // ── Inline variant ───────────────────────────────────────────────────────
    if (variant === "inline") {
      return (
        <div
          ref={ref}
          role="alert"
          className={cn(
            "flex items-center gap-3 rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 transition-colors",
            className
          )}
          {...props}
        >
          <WarningIcon className="shrink-0 text-danger" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-danger">{title}</p>
            {message && (
              <p className="text-xs text-danger/80">{message}</p>
            )}
          </div>
          {retryButton}
        </div>
      );
    }

    // ── Page variant ─────────────────────────────────────────────────────────
    if (variant === "page") {
      return (
        <div
          ref={ref}
          role="alert"
          className={cn(
            "flex min-h-[480px] flex-col items-center justify-center gap-6 px-4 py-16 text-center sm:px-8",
            className
          )}
          {...props}
        >
          <div
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10"
          >
            <WarningIcon className="h-8 w-8 text-danger" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {message && (
              <p className="max-w-md text-sm text-muted-foreground">
                {message}
              </p>
            )}
          </div>
          {retryButton}
        </div>
      );
    }

    // ── Card variant (default) ───────────────────────────────────────────────
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-card p-8 text-center transition-colors",
          className
        )}
        {...props}
      >
        <div
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10"
        >
          <WarningIcon className="text-danger" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {message && (
            <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
          )}
        </div>
        {retryButton}
      </div>
    );
  }
);
ErrorState.displayName = "ErrorState";
