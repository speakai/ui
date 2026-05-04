import {
  ChangeEvent,
  forwardRef,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "../utils/cn";
import { inputBase } from "../utils/inputBase";

// Inline SVG paths sourced from Lucide v0.x (MIT) — avoids a runtime dependency.
const SearchIconSvg = () => (
  <svg
    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.34-4.34" />
  </svg>
);

const ClearIconSvg = () => (
  <svg
    className="h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

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
  /**
   * Render a magnifying-glass icon at the left edge of the input.
   * Defaults to `false` to preserve the visual contract for existing consumers.
   * Set to `true` to opt in.
   */
  icon?: boolean;
  /**
   * Callback invoked when the user clicks the clear (×) button.
   * When provided and the input has a non-empty value, a clear button is shown
   * at the right edge of the input.
   */
  onClear?: () => void;
  /**
   * When `true` and `onChange` is wired, clicking the clear button fires
   * `onChange` with an empty string value — no explicit `onClear` callback
   * needed for the simple "user clicks ×, input empties" pattern.
   * Defaults to `false`.
   */
  clearable?: boolean;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      className,
      containerClassName,
      icon = false,
      onClear,
      clearable = false,
      onChange,
      ...props
    },
    ref,
  ) => {
    const hasValue = Boolean(props.value);
    const showClear = (onClear !== undefined || clearable) && hasValue;

    const handleClear = () => {
      if (onClear) {
        onClear();
      } else if (clearable && onChange) {
        // Synthesise a change event with an empty value so callers using only
        // `onChange` get the "clear" signal without an extra callback.
        const syntheticEvent = {
          target: { value: "" },
          currentTarget: { value: "" },
        } as ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className={cn("relative w-full", containerClassName)}>
        {icon && <SearchIconSvg />}
        <input
          ref={ref}
          type="search"
          className={cn(
            inputBase,
            "h-10",
            defaultRing,
            icon && "pl-9",
            showClear && "pr-9",
            className,
          )}
          onChange={onChange}
          {...props}
        />
        {showClear && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ClearIconSvg />
          </button>
        )}
      </div>
    );
  },
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
