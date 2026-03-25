"use client";

import { cn } from "../utils/cn";
import { Button } from "./Button";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ErrorStateProps {
  variant?: "page" | "card" | "inline";
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

// ── Icons ──────────────────────────────────────────────────────────────────────

const WarningIcon = ({ className }: { className?: string }) => (
  <svg
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

export const ErrorState = ({
  variant = "card",
  title = "Something went wrong",
  message = "An unexpected error occurred. Please try again.",
  onRetry,
  retryLabel = "Try again",
  className,
}: ErrorStateProps) => {
  const retryButton = onRetry ? (
    <Button variant="secondary" size="sm" onClick={onRetry}>
      <RetryIcon />
      {retryLabel}
    </Button>
  ) : null;

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 transition-all duration-200 dark:border-red-800 dark:bg-red-900/20",
          className
        )}
      >
        <WarningIcon className="text-red-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-red-800 dark:text-red-300">{title}</p>
          {message && (
            <p className="text-xs text-red-600 dark:text-red-400">{message}</p>
          )}
        </div>
        {retryButton}
      </div>
    );
  }

  if (variant === "page") {
    return (
      <div
        className={cn(
          "flex min-h-[480px] flex-col items-center justify-center gap-6 p-8 text-center",
          className
        )}
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
          <WarningIcon className="h-8 w-8 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          {message && (
            <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">{message}</p>
          )}
        </div>
        {retryButton}
      </div>
    );
  }

  // card (default)
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-2xl border border-gray-200 bg-white p-8 text-center transition-all duration-200 dark:border-gray-700 dark:bg-gray-800",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
        <WarningIcon className="text-red-500" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
        {message && (
          <p className="max-w-sm text-sm text-gray-500 dark:text-gray-400">{message}</p>
        )}
      </div>
      {retryButton}
    </div>
  );
};
ErrorState.displayName = "ErrorState";
