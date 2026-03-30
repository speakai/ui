import {
  forwardRef,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../utils/cn";
import { inputBase } from "../utils/inputBase";

const errorRing = "border-danger focus-visible:ring-danger";
const defaultRing = "border-input";

// ── Input ─────────────────────────────────────────────────────────────────────

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Pass `true` for red border only, or a string to show an error message below the input. */
  error?: boolean | string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          inputBase,
          "h-10",
          error ? errorRing : defaultRing,
          className,
        )}
        {...props}
      />
      {typeof error === "string" && error && (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      )}
    </div>
  ),
);

Input.displayName = "Input";

// ── SearchInput ───────────────────────────────────────────────────────────────

export interface SearchInputProps
  extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional class name for the wrapper div */
  containerClassName?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, containerClassName, ...props }, ref) => (
    <div className={cn("relative w-full", containerClassName)}>
      <input
        ref={ref}
        type="search"
        className={cn(
          inputBase,
          "h-10",
          defaultRing,
          className,
        )}
        {...props}
      />
    </div>
  ),
);

SearchInput.displayName = "SearchInput";

// ── Select ────────────────────────────────────────────────────────────────────

export interface SelectProps
  extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Pass `true` for red border only, or a string to show an error message below the select. */
  error?: boolean | string;
  /** Shorthand — renders `<option>` elements. When `children` are also provided, `children` take precedence. */
  options?: Array<{ value: string; label: string }>;
  /** Placeholder option (shown as first disabled option when using `options` prop) */
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, options, placeholder, id, ...props }, ref) => (
    <div className="relative w-full">
      <select
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          inputBase,
          "h-10 appearance-none pr-10",
          error ? errorRing : defaultRing,
          className,
        )}
        {...props}
      >
        {children ?? (
          <>
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </>
        )}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
        />
      </svg>
      {typeof error === "string" && error && (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      )}
    </div>
  ),
);

Select.displayName = "Select";

// ── Textarea ──────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Pass `true` for red border only, or a string to show an error message below the textarea. */
  error?: boolean | string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(
          inputBase,
          "min-h-[80px] py-2.5",
          error ? errorRing : defaultRing,
          className,
        )}
        {...props}
      />
      {typeof error === "string" && error && (
        <p className="mt-1.5 text-xs text-danger">{error}</p>
      )}
    </div>
  ),
);

Textarea.displayName = "Textarea";
