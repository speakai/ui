import { forwardRef, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "../utils/cn";

// ── Input ──────────────────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          "dark:bg-gray-800 dark:text-white dark:placeholder-gray-500",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
            : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 dark:border-gray-700 dark:focus:border-purple-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
);
Input.displayName = "Input";

// ── SearchInput ────────────────────────────────────────────────────────────────

export interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full">
      <svg
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      <input
        ref={ref}
        type="search"
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500",
          "dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-500 dark:focus:border-purple-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
    </div>
  )
);
SearchInput.displayName = "SearchInput";

// ── Select ─────────────────────────────────────────────────────────────────────

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-offset-0",
          "dark:bg-gray-800 dark:text-white",
          error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500"
            : "border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 dark:border-gray-700 dark:focus:border-purple-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  )
);
Select.displayName = "Select";
