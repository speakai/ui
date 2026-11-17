"use client";

import { forwardRef, HTMLAttributes, useCallback } from "react";
import { cn } from "../utils/cn";
import { FieldError, useFieldError } from "./FieldError";
import { inputBase } from "../utils/inputBase";

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

    const { errorId, errorMessage, ariaDescribedBy } = useFieldError(error);
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
          aria-describedby={ariaDescribedBy}
          className={cn(
            inputBase,
            "h-10",
            error ? errorRing : defaultRing,
          )}
        />
        <FieldError id={errorId}>{errorMessage}</FieldError>
      </div>
    );
  },
);

TimePicker.displayName = "TimePicker";
