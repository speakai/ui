import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gradient" | "glass" | "solid";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none";

    const variants = {
      primary:
        "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 active:scale-100",
      gradient:
        "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 focus:ring-purple-500 rounded-full shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-105 active:scale-100",
      secondary:
        "bg-white/10 dark:bg-gray-700/50 backdrop-blur-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 hover:bg-white/20 dark:hover:bg-gray-600/70 focus:ring-gray-500 rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-100",
      danger:
        "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 focus:ring-red-500 rounded-xl shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105 active:scale-100",
      ghost:
        "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500 rounded-lg hover:scale-105 active:scale-100",
      glass:
        "bg-white/10 backdrop-blur-xl border border-white/20 text-white hover:bg-white/20 focus:ring-purple-500/50 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-100",
      solid:
        "text-white focus:ring-offset-2 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-100 border-2",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm gap-1.5",
      md: "px-4 py-2 text-base gap-2",
      lg: "px-6 py-3 text-lg gap-2",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
