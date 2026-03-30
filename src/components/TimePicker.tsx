"use client";

import { forwardRef, HTMLAttributes, useCallback } from "react";
import { cn } from "../utils/cn";

// ── Shared styles (matching Input.tsx) ───────────────────────────────────────

const inputBase = [
  "flex w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground",
  "placeholder:text-muted-foreground",
  "transition-colors",
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  "disabled:pointer-events-none disabled:opacity-50",
].join(" ");

const errorRing = "border-danger focus-visible:ring-danger";
const defaultRing = "border-input";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TimePickerProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Time value as "HH:mm" string */
  value?: string;
  /** Called with "HH:mm" string */
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Pass `true` for red border only, or a string to show an error message. */
  error?: boolean | string;
  label?: string;
  /** Minimum time ("HH:mm") */
  min?: string;
  /** Maximum time ("HH:mm") */
  max?: string;
  /** Step in seconds (default 60) */
  step?: number;
}

// ── Component ────────────────────────────────────────────────────────────────

export const TimePicker = forwardRef<HTMLDivElement, TimePickerProps>(
  (
    {
      className,
      value = "",
      onChange,
      placeholder,
      disabled = false,
      error,
      label,
      min,
      max,
      step = 60,
      ...props
    },
    ref,
  ) => {
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
      },
      [onChange],
    );

    const inputId = props.id ?? (label ? `timepicker-${label.replace(/\s+/g, "-").toLowerCase()}` : undefined);

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type="time"
          value={value}
          onChange={handleChange}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          className={cn(
            inputBase,
            "h-10",
            error ? errorRing : defaultRing,
          )}
        />
        {typeof error === "string" && error && (
          <p className="mt-1.5 text-xs text-danger">{error}</p>
        )}
      </div>
    );
  },
);

TimePicker.displayName = "TimePicker";
